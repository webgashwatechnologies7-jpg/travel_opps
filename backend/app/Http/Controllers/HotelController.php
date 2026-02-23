<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Services\FileUploadService;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HotelController extends Controller
{
    use GenericCrudTrait;

    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    protected function getModel()
    {
        return Hotel::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'nullable|integer|min:1|max:5',
            'destination' => 'required|string|max:255',
            'hotel_photo' => 'nullable|image|max:2048',
            'hotel_address' => 'required|string',
            'email' => 'nullable|email|max:255',
            'hotel_link' => 'nullable|url|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($hotel)
    {
        return [
            'id' => $hotel->id,
            'name' => $hotel->name,
            'category' => $hotel->category,
            'destination' => $hotel->destination,
            'hotel_details' => $hotel->hotel_details,
            'hotel_photo' => $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : null,
            'contact_person' => $hotel->contact_person,
            'email' => $hotel->email,
            'phone' => $hotel->phone,
            'hotel_address' => $hotel->hotel_address,
            'hotel_link' => $hotel->hotel_link,
            'status' => $hotel->status,
            'price_updates_count' => $hotel->price_updates_count,
            'created_by' => $hotel->created_by,
            'created_by_name' => $hotel->creator ? $hotel->creator->name : 'System',
            'updated_at' => $hotel->updated_at,
            'created_at' => $hotel->created_at,
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

            $photoPath = $request->hasFile('hotel_photo')
                ? $this->fileUploadService->upload($request->file('hotel_photo'), 'hotels')
                : null;

            $hotel = Hotel::create(array_merge($request->only([
                'name',
                'category',
                'destination',
                'hotel_details',
                'contact_person',
                'email',
                'phone',
                'hotel_address',
                'hotel_link',
                'status'
            ]), [
                'hotel_photo' => $photoPath,
                'created_by' => auth()->id(),
            ]));

            return $this->createdResponse($this->formatResource($hotel->refresh()), 'Hotel created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create hotel', $e);
        }
    }

    /**
     * Override update to handle photo upload.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $hotel = Hotel::find($id);
            if (!$hotel)
                return $this->notFoundResponse('Hotel not found');

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'hotel_photo' => 'nullable|image|max:2048',
            ]);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $data = $request->only([
                'name',
                'category',
                'destination',
                'hotel_details',
                'contact_person',
                'email',
                'phone',
                'hotel_address',
                'hotel_link',
                'status'
            ]);

            if ($request->hasFile('hotel_photo')) {
                $data['hotel_photo'] = $this->fileUploadService->update(
                    $request->file('hotel_photo'),
                    $hotel->hotel_photo,
                    'hotels'
                );
            }

            $hotel->update($data);
            return $this->updatedResponse($this->formatResource($hotel->refresh()), 'Hotel updated successfully');
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
            $hotel = Hotel::find($id);
            if (!$hotel)
                return $this->notFoundResponse('Hotel not found');

            $this->fileUploadService->delete($hotel->hotel_photo);
            $hotel->delete();
            return $this->deletedResponse('Hotel deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Delete failed', $e);
        }
    }

    /**
     * Search hotels from local database.
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->input('query');
            $location = $request->input('location');

            $results = Hotel::where('name', 'like', "%$query%")
                ->orWhere('destination', 'like', "%$location%")
                ->limit(20)
                ->get()
                ->map(fn($h) => $this->formatResource($h));

            return $this->successResponse(['local' => $results, 'external' => []], 'Search completed');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Search failed', $e);
        }
    }

    /**
     * Export hotels to CSV.
     */
    public function export(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="hotels_export_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, ['ID', 'Name', 'Category', 'Destination', 'Email', 'Phone', 'Address']);

            Hotel::chunk(100, function ($hotels) use ($file) {
                foreach ($hotels as $hotel) {
                    fputcsv($file, [$hotel->id, $hotel->name, $hotel->category, $hotel->destination, $hotel->email, $hotel->phone, $hotel->hotel_address]);
                }
            });
            fclose($file);
        }, 200, $headers);
    }
}
