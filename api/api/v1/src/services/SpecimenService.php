<?php

namespace App\Services;

use App\DTO\SpecimenPublicDTO;
use App\DTO\SpecimenSummaryDTO;

class SpecimenService
{
    private array $specimens;

    public function __construct()
    {
        $file = __DIR__ . '/../../data/specimens.json';

        if (!file_exists($file)) {
            throw new \RuntimeException('Specimen data file not found.');
        }

        $json = file_get_contents($file);

        if ($json === false) {
            throw new \RuntimeException('Unable to read specimen data.');
        }

        $data = json_decode($json, true);

        if (!is_array($data)) {
            throw new \RuntimeException('Invalid specimen JSON.');
        }

        $this->specimens = $data;
    }

    /**
     * Devuelve la lista ligera para las tarjetas del frontend.
     * @return SpecimenSummaryDTO[]
     */
    public function getSummaries(): array
    {
        return array_map(
            fn(array $item) => SpecimenSummaryDTO::fromArray($item),
            $this->specimens
        );
    }

    /**
     * Devuelve los datos detallados del espécimen expuesto al público.
     */
    public function getPublicBySpecimen(string $specimen): ?SpecimenPublicDTO
    {
        foreach ($this->specimens as $item) {
            if (isset($item['Specimen']) && $item['Specimen'] === $specimen) {
                return SpecimenPublicDTO::fromArray($item);
            }
        }

        return null;
    }
}