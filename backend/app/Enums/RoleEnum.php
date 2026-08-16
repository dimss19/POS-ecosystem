<?php

namespace App\Enums;

enum RoleEnum: string
{
    case ADMIN = 'admin';
    case CASHIER = 'cashier';

    /**
     * Get all role values
     */
    public static function values(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    /**
     * Check if role is admin
     */
    public function isAdmin(): bool
    {
        return $this === self::ADMIN;
    }

    /**
     * Check if role is cashier
     */
    public function isCashier(): bool
    {
        return $this === self::CASHIER;
    }

    /**
     * Get role label
     */
    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrator',
            self::CASHIER => 'Cashier',
        };
    }
}
