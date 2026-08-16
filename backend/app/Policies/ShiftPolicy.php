<?php

namespace App\Policies;

use App\Models\Shift;
use App\Models\User;

class ShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Shift $shift): bool
    {
        return $user->isAdmin() || $user->id === $shift->cashier_id;
    }

    public function open(User $user): bool
    {
        return true;
    }

    public function close(User $user, Shift $shift): bool
    {
        return $user->isAdmin() || $user->id === $shift->cashier_id;
    }
}
