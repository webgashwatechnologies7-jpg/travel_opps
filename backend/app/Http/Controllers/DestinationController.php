<?php

namespace App\Http\Controllers;

use App\Models\Destination;
use App\Services\FileUploadService;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DestinationController extends Controller
{
    use GenericCrudTrait;

    protected FileUploadService $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    protected function getModel()
    {
        return Destination::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
            'photo' => 'nullable|image|max:2048',
        ];
    }

    protected function formatResource($destination)
    {
        return [
            'id' => $destination->id,
            'name' => $destination->name,
            'photo' => $destination->photo ? asset('storage/' . $destination->photo) : null,
            'status' => $destination->status,
            'updated_at' => $destination->updated_at,
            'created_at' => $destination->created_at,
        ];
    }

    /**
     * Override store to handle photo upload.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), $this->getValidationRules());
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $photoPath = $request->hasFile('photo')
                ? $this->fileUploadService->upload($request->file('photo'), 'destinations')
                : null;

            $destination = Destination::create(array_merge($request->only(['name', 'status']), [
                'photo' => $photoPath,
                'created_by' => auth()->id(), // Using created_by instead of company_id
            ]));

            return $this->createdResponse($this->formatResource($destination->refresh()), 'Destination created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create destination', $e);
        }
    }

    /**
     * Override update to handle photo upload.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $destination = Destination::find($id);
            if (!$destination) {
                return $this->notFoundResponse('Destination not found');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|in:active,inactive',
                'photo' => 'nullable|image|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $data = $request->only(['name', 'status']);

            if ($request->hasFile('photo')) {
                $data['photo'] = $this->fileUploadService->update(
                    $request->file('photo'),
                    $destination->photo,
                    'destinations'
                );
            }

            $destination->update($data);

            return $this->updatedResponse($this->formatResource($destination->refresh()), 'Destination updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Update failed', $e);
        }
    }

    /**
     * Override destroy to delete photo.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $destination = Destination::find($id);
            if (!$destination) {
                return $this->notFoundResponse('Destination not found');
            }

            if ($destination->photo) {
                $this->fileUploadService->delete($destination->photo);
            }

            $destination->delete();
            return $this->deletedResponse('Destination deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Delete failed', $e);
        }
    }
}
