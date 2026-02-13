<?php

namespace App\Http\Controllers;

use App\Models\QueryDocument;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'nullable|integer|exists:leads,id',
                'document_type' => 'nullable|string|max:50',
                'document_category' => 'nullable|string|max:50',
                'status' => 'nullable|in:pending,verified,rejected,expired,expired_soon,active,inactive',
                'access_level' => 'nullable|in:private,internal,public'
            ], [
                'lead_id.exists' => 'Lead ID is invalid.',
                'document_type.max' => 'Document type must not exceed 50 characters.',
                'document_category.max' => 'Document category must not exceed 50 characters.',
                'status.in' => 'Status must be one of: pending, verified, rejected, expired, expired_soon, active, inactive.',
                'access_level.in' => 'Access level must be one of: private, internal, public.'
            ]);

            if ($validator->fails()) {
                \Log::warning('Document index validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $companyId = $request->user()->company_id;
            
            try {
                $query = QueryDocument::query()
                    ->with(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email'])
                    ->where('company_id', $companyId);
                
                if ($request->filled('lead_id')) {
                    $query->where('lead_id', (int) $request->input('lead_id'));
                }
                
                if ($request->filled('status')) {
                    $query->where('status', $request->input('status'));
                }
                
                if ($request->filled('document_type')) {
                    $query->where('document_type', $request->input('document_type'));
                }
                
                if ($request->filled('document_category')) {
                    $query->where('document_category', $request->input('document_category'));
                }
                
                if ($request->filled('access_level')) {
                    $query->where('access_level', $request->input('access_level'));
                }
                
                $query->orderByDesc('updated_at');
                
                $documents = $query->get()->map(function (QueryDocument $doc) {
                    return $this->formatDocument($doc);
                });
                
                \Log::info('Documents retrieved successfully', [
                    'document_count' => $documents->count(),
                    'filters' => $request->all(),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Documents retrieved successfully',
                    'data' => [
                        'documents' => $documents,
                        'total' => $documents->count(),
                        'filters' => $request->all(),
                        'expired_count' => $documents->where('status', 'expired')->count(),
                        'expiring_soon_count' => $documents->where('status', 'expired_soon')->count(),
                        'verified_count' => $documents->where('status', 'verified')->count(),
                        'rejected_count' => $documents->where('status', 'rejected')->count(),
                        'pending_count' => $documents->where('status', 'pending')->count(),
                        'active_count' => $documents->where('status', 'active')->count()
                    ],
                ], 200);
                
            } catch (\Exception $dbError) {
                \Log::error('Database error fetching documents', [
                    'error' => $dbError->getMessage(),
                    'user_id' => auth()->id(),
                    'filters' => $request->all()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve documents',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }
            
        } catch (\Exception $e) {
            \Log::error('Critical error in documents index', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve documents',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|integer|exists:leads,id',
                'document_type' => 'required|string|max:50',
                'document_category' => 'required|string|max:50',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'expiry_date' => 'nullable|date|after:now',
                'is_required' => 'required|boolean',
                'access_level' => 'required|in:private,internal,public',
                'tags' => 'nullable|array',
                'metadata' => 'nullable|array',
                'file' => 'required|file|max:20480|mimes:pdf,doc,docx,jpg,jpeg,png,gif',
                'tags.*' => 'nullable|string|max:50'
            ], [
                'lead_id.required' => 'Lead ID is required.',
                'lead_id.exists' => 'Lead ID is invalid.',
                'document_type.required' => 'Document type is required.',
                'document_type.max' => 'Document type must not exceed 50 characters.',
                'document_category.required' => 'Document category is required.',
                'title.required' => 'Document title is required.',
                'title.max' => 'Title must not exceed 255 characters.',
                'description.max' => 'Description must not exceed 1000 characters.',
                'file.required' => 'Document file is required.',
                'file.max' => 'File must not exceed 20MB.',
                'file.mimes' => 'File must be one of: pdf, doc, docx, jpg, jpeg, png, gif.',
                'is_required.required' => 'Required field is required.',
                'access_level.required' => 'Access level is required.',
                'tags.*.max' => 'Each tag must not exceed 50 characters.',
                'expiry_date.after' => 'Expiry date must be a future date.',
            ]);

            if ($validator->fails()) {
                \Log::warning('Document store validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            try {
                $user = $request->user();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not authenticated',
                    ], 401);
                }
            } catch (\Exception $authError) {
                \Log::error('Authentication error in document store', [
                    'error' => $authError->getMessage()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication error'
                ], 401);
            }

            try {
                $lead = Lead::find($request->input('lead_id'));
                
                if (!$lead) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Lead not found',
                    ], 404);
                }
                
                if ($lead->company_id !== $user->company_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Lead does not belong to your company',
                    ], 403);
                }
                
                \Log::info('Lead validated successfully', [
                    'lead_id' => $lead->id,
                    'user_id' => $user->id()
                ]);
            } catch (\Exception $leadError) {
                \Log::error('Error validating lead for document', [
                    'error' => $leadError->getMessage(),
                    'lead_id' => $request->input('lead_id'),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to validate lead',
                    'error' => config('app.debug') ? $leadError->getMessage() : 'Database error'
                ], 500);
            }

            $file = $request->file('file');
            
            try {
                if (!$file->isValid()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid file upload',
                        'error' => $file->getErrorMessage()
                    ], 422);
                }
                
                if ($file->getSize() > 20480 * 1024) { 
                    return response()->json([
                        'success' => false,
                        'message' => 'File size exceeds 20MB limit',
                        'error' => 'File too large'
                    ], 422);
                }
                
                $allowedMimes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];
                if (!in_array($file->getClientOriginalExtension(), $allowedMimes)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File type not allowed. Allowed types: ' . implode(', ', $allowedMimes),
                        'error' => 'Invalid file type'
                    ], 422);
                }
                
                \Log::info('Document file validated successfully', [
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getClientOriginalExtension(),
                    'user_id' => auth()->id()
                ]);
                
            } catch (\Exception $fileError) {
                \Log::error('File validation error', [
                    'error' => $fileError->getMessage(),
                    'file_name' => $file->getClientOriginalName() ?? 'unknown',
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'File validation failed',
                    'error' => $fileError->getMessage()
                ], 500);
            }

            try {
                $companyId = $user->company_id;
                $path = $file->store("documents/{$companyId}/leads/{$lead->id}", 'public');
                
                if (!$path) {
                    throw new \Exception('Failed to store file');
                }
                
                $document = QueryDocument::create([
                    'lead_id' => $lead->id,
                    'document_type' => $request->input('document_type'),
                    'document_category' => $request->input('document_category'),
                    'title' => $request->input('title'),
                    'description' => $request->input('description'),
                    'file_path' => $path,
                    'expiry_date' => $request->input('expiry_date'),
                    'is_required' => $request->input('is_required', false),
                    'access_level' => $request->input('access_level', 'public'),
                    'tags' => $request->input('tags', []),
                    'metadata' => $request->input('metadata', []),
                    'status' => $request->input('status', 'pending'),
                    'uploaded_by' => $user->id(),
                    'company_id' => $companyId,
                ]);
                
                \Log::info('Document created successfully', [
                    'document_id' => $document->id,
                    'lead_id' => $lead->id,
                    'title' => $document->title,
                    'document_type' => $document->document_type,
                    'file_path' => $path,
                    'user_id' => $user->id()
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Document uploaded successfully',
                    'data' => [
                        'document' => $document,
                        'document_url' => asset('storage/' . $path),
                        'document_type' => $document->document_type,
                        'title' => $document->title,
                        'description' => $document->description,
                        'expiry_date' => $document->expiry_date,
                        'is_required' => $document->is_required,
                        'access_level' => $document->access_level,
                        'status' => $document->status,
                        'uploaded_by' => $user->id(),
                        'company_id' => $companyId,
                    ],
                ], 201);
                
            } catch (\Exception $dbError) {
                \Log::error('Database error creating document', [
                    'error' => $dbError->getMessage(),
                    'lead_id' => $request->input('lead_id'),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload document',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }
            
        } catch (\Exception $e) {
            \Log::error('Critical error in document store', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $document = QueryDocument::with(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document retrieved successfully',
                'data' => [
                    'document' => $this->formatDocument($document),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'document_type' => 'nullable|string|max:50',
                'document_category' => 'nullable|string|max:50',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'expiry_date' => 'nullable|date',
                'is_required' => 'boolean',
                'access_level' => 'nullable|in:private,internal,public',
                'tags' => 'nullable|array',
                'metadata' => 'nullable|array',
                'file' => 'nullable|file|max:20480',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = $request->user()->company_id;

            $document = QueryDocument::with(['lead:id,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found',
                ], 404);
            }

            if ($request->hasFile('file')) {
                $file = $request->file('file');

                if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                    Storage::disk('public')->delete($document->file_path);
                }

                $path = $file->store("documents/{$companyId}/leads/{$document->lead_id}", 'public');

                $document->file_name = $file->getClientOriginalName();
                $document->file_path = $path;
                $document->file_type = $file->getClientOriginalExtension();
                $document->file_size = $file->getSize();
                $document->status = 'pending';
                $document->is_verified = false;
                $document->verified_by = null;
                $document->verified_at = null;
                $document->rejection_reason = null;
            }

            foreach (['document_type', 'document_category', 'title', 'description', 'expiry_date', 'access_level'] as $field) {
                if ($request->filled($field)) {
                    $document->{$field} = $request->input($field);
                }
            }

            if ($request->has('is_required')) {
                $document->is_required = (bool) $request->boolean('is_required');
            }

            if ($request->has('tags')) {
                $document->tags = $request->input('tags');
            }

            if ($request->has('metadata')) {
                $document->metadata = $request->input('metadata');
            }

            $document->save();
            $document->load(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email']);

            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully',
                'data' => [
                    'document' => $this->formatDocument($document),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $document = QueryDocument::with(['lead:id,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found',
                ], 404);
            }

            if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $document = QueryDocument::with(['lead:id,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found',
                ], 404);
            }

            $document->is_verified = true;
            $document->status = 'verified';
            $document->verified_by = $request->user()->id;
            $document->verified_at = now();
            $document->rejection_reason = null;
            $document->save();

            $document->load(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email']);

            return response()->json([
                'success' => true,
                'message' => 'Document verified successfully',
                'data' => [
                    'document' => $this->formatDocument($document),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = $request->user()->company_id;

            $document = QueryDocument::with(['lead:id,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found',
                ], 404);
            }

            $document->is_verified = false;
            $document->status = 'rejected';
            $document->verified_by = $request->user()->id;
            $document->verified_at = now();
            $document->rejection_reason = $request->input('reason');
            $document->save();

            $document->load(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email']);

            return response()->json([
                'success' => true,
                'message' => 'Document rejected successfully',
                'data' => [
                    'document' => $this->formatDocument($document),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function getExpired(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $documents = QueryDocument::expired()
                ->with(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->orderBy('expiry_date', 'asc')
                ->get()
                ->map(function (QueryDocument $doc) {
                    return $this->formatDocument($doc);
                });

            return response()->json([
                'success' => true,
                'message' => 'Expired documents retrieved successfully',
                'data' => [
                    'documents' => $documents,
                    'total' => $documents->count(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve expired documents',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function getExpiringSoon(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'days' => 'nullable|integer|min:1|max:365',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $days = (int) $request->input('days', 30);
            $companyId = $request->user()->company_id;

            $documents = QueryDocument::expiringSoon($days)
                ->with(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->orderBy('expiry_date', 'asc')
                ->get()
                ->map(function (QueryDocument $doc) {
                    return $this->formatDocument($doc);
                });

            return response()->json([
                'success' => true,
                'message' => 'Expiring soon documents retrieved successfully',
                'data' => [
                    'documents' => $documents,
                    'total' => $documents->count(),
                    'days' => $days,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve expiring documents',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function download(Request $request, int $id)
    {
        $companyId = $request->user()->company_id;

        $document = QueryDocument::with(['lead:id,company_id'])
            ->whereHas('lead', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
            ->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found',
            ], 404);
        }

        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        $absolutePath = Storage::disk('public')->path($document->file_path);
        $downloadName = $document->file_name ?: basename($document->file_path);

        return response()->download($absolutePath, $downloadName);
    }

    private function formatDocument(QueryDocument $doc): array
    {
        $publicUrl = null;
        if ($doc->file_path) {
            $publicUrl = Storage::disk('public')->url($doc->file_path);
        }

        return [
            'id' => $doc->id,
            'lead_id' => $doc->lead_id,
            'document_type' => $doc->document_type,
            'document_category' => $doc->document_category,
            'title' => $doc->title,
            'description' => $doc->description,
            'file_name' => $doc->file_name,
            'file_path' => $doc->file_path,
            'file_url' => $publicUrl,
            'file_type' => $doc->file_type,
            'file_size' => $doc->file_size,
            'is_verified' => (bool) $doc->is_verified,
            'is_required' => (bool) $doc->is_required,
            'expiry_date' => $doc->expiry_date,
            'status' => $doc->status,
            'rejection_reason' => $doc->rejection_reason,
            'tags' => $doc->tags,
            'access_level' => $doc->access_level,
            'metadata' => $doc->metadata,
            'uploaded_by' => $doc->uploaded_by,
            'verified_by' => $doc->verified_by,
            'verified_at' => $doc->verified_at,
            'received_at' => $doc->created_at,
            'created_at' => $doc->created_at,
            'updated_at' => $doc->updated_at,
            'lead' => $doc->relationLoaded('lead') ? $doc->lead : null,
            'uploader' => $doc->relationLoaded('uploader') ? $doc->uploader : null,
            'verifier' => $doc->relationLoaded('verifier') ? $doc->verifier : null,
        ];
    }
}
