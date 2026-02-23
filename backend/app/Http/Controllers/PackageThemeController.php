<?php

namespace App\Http\Controllers;

use App\Models\PackageTheme;
use App\Services\FileUploadService;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PackageThemeController extends Controller
{
    use GenericCrudTrait;

    protected FileUploadService $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    protected function getModel()
    {
        return PackageTheme::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'icon' => 'nullable|image|max:2048',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($packageTheme)
    {
        return [
            'id' => $packageTheme->id,
            'name' => $packageTheme->name,
            'icon' => $packageTheme->icon ? asset('storage/' . $packageTheme->icon) : null,
            'status' => $packageTheme->status,
            'created_by' => $packageTheme->created_by,
            'created_by_name' => $packageTheme->creator ? $packageTheme->creator->name : 'Travbizz Travel IT Solutions',
            'last_update' => $packageTheme->updated_at ? $packageTheme->updated_at->format('d-m-Y') : null,
            'updated_at' => $packageTheme->updated_at,
            'created_at' => $packageTheme->created_at,
        ];
    }

    /**
     * Override store to handle icon file upload.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), $this->getValidationRules());
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $iconPath = $request->hasFile('icon')
                ? $this->fileUploadService->upload($request->file('icon'), 'package-themes')
                : null;

            $packageTheme = PackageTheme::create([
                'name' => $request->name,
                'icon' => $iconPath,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $packageTheme->load('creator');

            return $this->createdResponse($this->formatResource($packageTheme), 'Package Theme created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create Package Theme', $e);
        }
    }

    /**
     * Override update to handle icon file upload.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $packageTheme = PackageTheme::find($id);
            if (!$packageTheme) {
                return $this->notFoundResponse('Package Theme not found');
            }

            $validator = Validator::make($request->all(), $this->getValidationRules($id));
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $iconPath = $request->hasFile('icon')
                ? $this->fileUploadService->update($request->file('icon'), $packageTheme->icon, 'package-themes')
                : $packageTheme->icon;

            $packageTheme->update([
                'name' => $request->has('name') ? $request->name : $packageTheme->name,
                'icon' => $iconPath,
                'status' => $request->has('status') ? $request->status : $packageTheme->status,
            ]);

            $packageTheme->load('creator');

            return $this->updatedResponse($this->formatResource($packageTheme), 'Package Theme updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update Package Theme', $e);
        }
    }

    /**
     * Override destroy to delete icon file.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $packageTheme = PackageTheme::find($id);
            if (!$packageTheme) {
                return $this->notFoundResponse('Package Theme not found');
            }

            $this->fileUploadService->delete($packageTheme->icon);
            $packageTheme->delete();

            return $this->deletedResponse('Package Theme deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete Package Theme', $e);
        }
    }
}
