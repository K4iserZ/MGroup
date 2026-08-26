<?php

namespace App\Services;

class GachaService
{
    private array $gacha;

    public function __construct()
    {
        $file = __DIR__ . '/../../data/gachav2.json';

        if (!file_exists($file)) {
            throw new \RuntimeException('Gacha data file not found.');
        }

        $json = file_get_contents($file);

        if ($json === false) {
            throw new \RuntimeException('Unable to read gacha data.');
        }

        $data = json_decode($json, true);

        if (!is_array($data)) {
            throw new \RuntimeException('Invalid gacha JSON.');
        }

        $this->gacha = $data;
    }

    public function getAll(): array
    {
        return $this->gacha;
    }
}