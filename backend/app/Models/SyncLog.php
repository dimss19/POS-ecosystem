<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'sync_type',
        'status',
        'records_count',
        'errors',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'records_count' => 'integer',
            'synced_at' => 'datetime',
        ];
    }

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
