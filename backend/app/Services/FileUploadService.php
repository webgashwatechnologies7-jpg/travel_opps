<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * Upload a file to a specified directory.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string $disk
     * @return string|false
     */
    public function upload(UploadedFile $file, string $directory, string $disk = 'public')
    {
        try {
            if (!$file->isValid()) {
                return false;
            }

            // Create directory if not exists
            if (!Storage::disk($disk)->exists($directory)) {
                Storage::disk($disk)->makeDirectory($directory);
            }

            // Store file with a unique name
            return $file->store($directory, $disk);
        } catch (\Exception $e) {
            \Log::error("File Upload Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a file from storage.
     *
     * @param string|null $path
     * @param string $disk
     * @return bool
     */
    public function delete(?string $path, string $disk = 'public')
    {
        if ($path && Storage::disk($disk)->exists($path)) {
            return Storage::disk($disk)->delete($path);
        }
        return false;
    }

    /**
     * Update an existing file (delete old and upload new).
     *
     * @param UploadedFile|null $newFile
     * @param string|null $oldPath
     * @param string $directory
     * @param string $disk
     * @return string|null
     */
    public function update(?UploadedFile $newFile, ?string $oldPath, string $directory, string $disk = 'public')
    {
        if (!$newFile) {
            return $oldPath;
        }

        // Delete old file if exists
        $this->delete($oldPath, $disk);

        // Upload new file
        return $this->upload($newFile, $directory, $disk);
    }
}
