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
                'status' => 'nullable|in:pending,verified,rejected,expired',
                'document_type' => 'nullable|string|max:50',
                'document_category' => 'nullable|string|max:50',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = $request->user()->company_id;

            $query = QueryDocument::query()
                ->with(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->orderByDesc('updated_at')
                ->orderByDesc('created_at');

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

            $documents = $query->get()->map(function (QueryDocument $doc) {
                return $this->formatDocument($doc);
            });

            return response()->json([
                'success' => true,
                'message' => 'Documents retrieved successfully',
                'data' => [
                    'documents' => $documents,
                    'total' => $documents->count(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve documents',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|integer|exists:leads,id',
                'document_type' => 'required|string|max:50',
                'document_category' => 'nullable|string|max:50',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'expiry_date' => 'nullable|date',
                'is_required' => 'boolean',
                'access_level' => 'nullable|in:private,internal,public',
                'tags' => 'nullable|array',
                'metadata' => 'nullable|array',
                'file' => 'required|file|max:20480',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $lead = Lead::find($request->input('lead_id'));

            if (!$lead || $lead->company_id !== $request->user()->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            $file = $request->file('file');
            $companyId = $request->user()->company_id;

            $path = $file->store("documents/{$companyId}/leads/{$lead->id}", 'public');

            $document = QueryDocument::create([
                'lead_id' => $lead->id,
                'document_type' => $request->input('document_type'),
                'document_category' => $request->input('document_category', 'other'),
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
                'file_size' => $file->getSize(),
                'is_verified' => false,
                'is_required' => (bool) $request->boolean('is_required'),
                'expiry_date' => $request->input('expiry_date'),
                'status' => 'pending',
                'rejection_reason' => null,
                'tags' => $request->input('tags'),
                'access_level' => $request->input('access_level', 'private'),
                'metadata' => $request->input('metadata'),
                'uploaded_by' => $request->user()->id,
                'verified_by' => null,
                'verified_at' => null,
            ]);

            $document->load(['lead:id,client_name,phone,email,company_id', 'uploader:id,name,email', 'verifier:id,name,email']);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => [
                    'document' => $this->formatDocument($document),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
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
