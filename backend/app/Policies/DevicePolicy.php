<?php

namespace App\Policies;

use App\Models\User;

class DevicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function register(User $user): bool
    {
        return true;
    }
}
