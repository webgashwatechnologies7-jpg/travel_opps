<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use App\Services\FileUploadService;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoomTypeController extends Controller
{
    use GenericCrudTrait;

    protected FileUploadService $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    protected function getModel()
    {
        return RoomType::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
            'image' => 'nullable|image|max:2048',
        ];
    }

    protected function formatResource($roomType)
    {
        return [
            'id' => $roomType->id,
            'name' => $roomType->name,
            'image' => $roomType->image ? asset('storage/' . $roomType->image) : null,
            'status' => $roomType->status,
            'created_by' => $roomType->created_by,
            'created_by_name' => $roomType->creator ? $roomType->creator->name : 'Travbizz Travel IT Solutions',
            'last_update' => $roomType->updated_at ? $roomType->updated_at->format('d-m-Y') : null,
            'updated_at' => $roomType->updated_at,
            'created_at' => $roomType->created_at,
        ];
    }

    /**
     * Override store to handle image upload.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), $this->getValidationRules());
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $imagePath = $request->hasFile('image')
                ? $this->fileUploadService->upload($request->file('image'), 'room_types')
                : null;

            $roomType = RoomType::create(array_merge($request->only(['name', 'status']), [
                'image' => $imagePath,
                'created_by' => auth()->id(),
            ]));

            return $this->createdResponse($this->formatResource($roomType->refresh()), 'Room Type created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create room type', $e);
        }
    }

    /**
     * Override update to handle image upload.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $roomType = RoomType::find($id);
            if (!$roomType) {
                return $this->notFoundResponse('Room Type not found');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|in:active,inactive',
                'image' => 'nullable|image|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $data = $request->only(['name', 'status']);

            if ($request->hasFile('image')) {
                $data['image'] = $this->fileUploadService->update(
                    $request->file('image'),
                    $roomType->image,
                    'room_types'
                );
            }

            $roomType->update($data);

            return $this->updatedResponse($this->formatResource($roomType->refresh()), 'Room Type updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Update failed', $e);
        }
    }

    /**
     * Override destroy to delete image.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $roomType = RoomType::find($id);
            if (!$roomType) {
                return $this->notFoundResponse('Room Type not found');
            }

            if ($roomType->image) {
                $this->fileUploadService->delete($roomType->image);
            }

            $roomType->delete();
            return $this->deletedResponse('Room Type deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Delete failed', $e);
        }
    }
}
