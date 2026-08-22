<?php

namespace App\Services;

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
     * Obtiene todos los especímenes.
     */
    public function getAll(): array
    {
        return $this->specimens;
    }

    /**
     * Busca un espécimen por su ID.
     */
    public function getBySpecimen(string $specimen): ?array
    {
        foreach ($this->specimens as $item) {

            if (
                isset($item['Specimen']) &&
                $item['Specimen'] === $specimen
            ) {
                return $item;
            }
        }

        return null;
    }
}