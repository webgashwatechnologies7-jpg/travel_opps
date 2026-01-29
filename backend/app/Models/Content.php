<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    protected $table = 'content';

    protected $fillable = [
        'key',
        'value',
        'group',
        'description',
    ];

    /**
     * Get value by key.
     */
    public static function getValue(string $key, ?string $default = null): ?string
    {
        $row = self::where('key', $key)->first();
        return $row ? ($row->value ?? $default) : $default;
    }

    /**
     * Get multiple keys as key => value array.
     */
    public static function getMany(array $keys): array
    {
        $rows = self::whereIn('key', $keys)->get();
        $result = array_fill_keys($keys, null);
        foreach ($rows as $row) {
            $result[$row->key] = $row->value;
        }
        return $result;
    }

    /**
     * Get all content, optionally by group.
     */
    public static function getAll(?string $group = null): array
    {
        $query = self::orderBy('group')->orderBy('key');
        if ($group !== null && $group !== '') {
            $query->where('group', $group);
        }
        return $query->get()->pluck('value', 'key')->toArray();
    }

    /**
     * Set value by key.
     */
    public static function setValue(string $key, ?string $value, ?string $group = null, ?string $description = null): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'group' => $group,
                'description' => $description,
            ]
        );
    }
}
