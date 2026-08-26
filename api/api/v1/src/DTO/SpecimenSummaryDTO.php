<?php

namespace App\DTO;

class SpecimenSummaryDTO
{
    public function __construct(
        public readonly string $specimen,
        public readonly string $name,
        public readonly string $dna,
        public readonly string $type
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            specimen: (string) ($data['Specimen'] ?? ''),
            name: (string) ($data['Name'] ?? ''),
            dna: (string) ($data['dna'] ?? ''),
            type: (string) ($data['type'] ?? '')
        );
    }
}