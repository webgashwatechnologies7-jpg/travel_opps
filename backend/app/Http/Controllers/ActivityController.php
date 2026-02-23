<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Services\FileUploadService;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ActivityController extends Controller
{
    use GenericCrudTrait;

    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    protected function getModel()
    {
        return Activity::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'activity_photo' => 'nullable|image|max:2048',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($activity)
    {
        return [
            'id' => $activity->id,
            'name' => $activity->name,
            'destination' => $activity->destination,
            'activity_details' => $activity->activity_details,
            'activity_photo' => $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : null,
            'status' => $activity->status,
            'created_by' => $activity->created_by,
            'created_by_name' => $activity->creator ? $activity->creator->name : 'System',
            'updated_at' => $activity->updated_at,
            'created_at' => $activity->created_at,
        ];
    }

    /**
     * Override store to handle photo upload.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), $this->getValidationRules());
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $photoPath = $request->hasFile('activity_photo')
                ? $this->fileUploadService->upload($request->file('activity_photo'), 'activities')
                : null;

            $activity = Activity::create(array_merge($request->only(['name', 'destination', 'activity_details', 'status']), [
                'activity_photo' => $photoPath,
                'created_by' => auth()->id(),
            ]));

            return $this->createdResponse($this->formatResource($activity->refresh()), 'Activity created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create activity', $e);
        }
    }

    /**
     * Override update to handle photo upload.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $activity = Activity::find($id);
            if (!$activity)
                return $this->notFoundResponse('Activity not found');

            $validator = Validator::make($request->all(), $this->getValidationRules($id));
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $data = $request->only(['name', 'destination', 'activity_details', 'status']);
            if ($request->hasFile('activity_photo')) {
                $data['activity_photo'] = $this->fileUploadService->update(
                    $request->file('activity_photo'),
                    $activity->activity_photo,
                    'activities'
                );
            }

            $activity->update($data);
            return $this->updatedResponse($this->formatResource($activity->refresh()), 'Activity updated successfully');
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
            $activity = Activity::find($id);
            if (!$activity)
                return $this->notFoundResponse('Activity not found');

            $this->fileUploadService->delete($activity->activity_photo);
            $activity->delete();
            return $this->deletedResponse('Activity deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Delete failed', $e);
        }
    }
}
