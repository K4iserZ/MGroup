<?php

namespace App\DTO;

class SpecimenDTO
{
    public function __construct(
        public readonly string $specimen,
        public readonly string $name,
        public readonly int $spX100,
        public readonly int $odds,
        public readonly string $dna,
        public readonly int $lifePoint,
        public readonly int $incubMin,
        public readonly string $atk1,
        public readonly string $atk1p,
        public readonly string $atk2,
        public readonly string $atk2p,
        public readonly int $bank,
        public readonly string $unlockAttack,
        public readonly string $type,
        public readonly string $recipes,
        public readonly string $abilities,
        public readonly int $abilityPct1,
        public readonly int $abilityPct2,
        public readonly string $orbSlots,
        public readonly string $attack1pName,
        public readonly string $attack2pName,
        public readonly string $description
    ) {
    }
}