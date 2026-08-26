<?php

namespace App\DTO;

class SpecimenPublicDTO
{
    public function __construct(
        public readonly string $specimen,
        public readonly string $name,
        public readonly int $spX100,
        public readonly int $odds,
        public readonly string $dna,
        public readonly int $lifePoint,
        public readonly string $atk1,
        public readonly string $atk1p,
        public readonly string $atk2,
        public readonly string $atk2p,
        public readonly int $bank,
        public readonly string $unlockAttack,
        public readonly string $type,
        public readonly string $abilities,
        public readonly int $abilityPct1,
        public readonly int $abilityPct2,
        public readonly string $orbSlots,
        public readonly string $attack1pName,
        public readonly string $attack2pName,
        public readonly string $description
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            specimen: (string) ($data['Specimen'] ?? ''),
            name: (string) ($data['Name'] ?? ''),
            spX100: (int) ($data['spX100'] ?? 0),
            odds: (int) ($data['odds'] ?? 0),
            dna: (string) ($data['dna'] ?? ''),
            lifePoint: (int) ($data['lifePoint'] ?? 0),
            atk1: (string) ($data['atk1'] ?? ''),
            atk1p: (string) ($data['atk1p'] ?? ''),
            atk2: (string) ($data['atk2'] ?? ''),
            atk2p: (string) ($data['atk2p'] ?? ''),
            bank: (int) ($data['bank'] ?? 0),
            unlockAttack: (string) ($data['unlockAttack'] ?? ''),
            type: (string) ($data['type'] ?? ''),
            abilities: (string) ($data['abilities'] ?? ''),
            abilityPct1: (int) ($data['abilityPct1'] ?? 0),
            abilityPct2: (int) ($data['abilityPct2'] ?? 0),
            orbSlots: (string) ($data['orbSlots'] ?? ''),
            attack1pName: (string) ($data['Attack1p_name'] ?? ''),
            attack2pName: (string) ($data['Attack2p_name'] ?? ''),
            description: (string) ($data['Description'] ?? '')
        );
    }
}