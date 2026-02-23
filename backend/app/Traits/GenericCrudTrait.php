<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Trait for handling generic CRUD operations in controllers.
 */
trait GenericCrudTrait
{
    /**
     * Get the model class for this controller.
     */
    abstract protected function getModel();

    /**
     * Get the validation rules for store/update.
     */
    abstract protected function getValidationRules($id = null);

    /**
     * Get the resource name for logging/responses.
     */
    protected function getResourceName()
    {
        return str_replace('Controller', '', class_basename($this));
    }

    /**
     * Index: List all resources.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = $this->getModel()::query();

            // Add basic ordering
            if (isset($request->order_by)) {
                $query->orderBy($request->order_by, $request->direction ?? 'asc');
            } else {
                $query->orderBy('updated_at', 'desc');
            }

            // Allow controllers to add extra eager loads on top of model's $with
            if (method_exists($this, 'getEagerLoads')) {
                $query->with($this->getEagerLoads());
            }

            $items = $query->get();

            // Support custom formatting
            if (method_exists($this, 'formatResource')) {
                $items = $items->map(fn($item) => $this->formatResource($item));
            }

            return $this->successResponse($items, $this->getResourceName() . ' retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve ' . $this->getResourceName(), $e);
        }
    }

    /**
     * Store: Create a new resource.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), $this->getValidationRules());

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $data = $request->all();

            // Auto-set created_by if column exists
            if (!isset($data['created_by']) && auth()->check()) {
                $data['created_by'] = auth()->id();
            }

            $item = $this->getModel()::create($data);

            if (method_exists($this, 'formatResource')) {
                $item = $this->formatResource($item);
            }

            return $this->createdResponse($item, $this->getResourceName() . ' created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create ' . $this->getResourceName(), $e);
        }
    }

    /**
     * Show: Get a single resource.
     */
    public function show($id): JsonResponse
    {
        try {
            $item = $this->getModel()::find($id);

            if (!$item) {
                return $this->notFoundResponse($this->getResourceName() . ' not found');
            }

            if (method_exists($this, 'formatResource')) {
                $item = $this->formatResource($item);
            }

            return $this->successResponse($item, $this->getResourceName() . ' retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve ' . $this->getResourceName(), $e);
        }
    }

    /**
     * Update: Update an existing resource.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $item = $this->getModel()::find($id);

            if (!$item) {
                return $this->notFoundResponse($this->getResourceName() . ' not found');
            }

            $validator = Validator::make($request->all(), $this->getValidationRules($id));

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $item->update($request->all());

            if (method_exists($this, 'formatResource')) {
                $item = $this->formatResource($item);
            }

            return $this->updatedResponse($item, $this->getResourceName() . ' updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update ' . $this->getResourceName(), $e);
        }
    }

    /**
     * Destroy: Delete a resource.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $item = $this->getModel()::find($id);

            if (!$item) {
                return $this->notFoundResponse($this->getResourceName() . ' not found');
            }

            $item->delete();

            return $this->deletedResponse($this->getResourceName() . ' deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete ' . $this->getResourceName(), $e);
        }
    }
}
