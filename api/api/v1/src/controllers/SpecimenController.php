<?php

namespace App\Controllers;

use App\DTO\SpecimenDTO;
use App\DTO\SpecimenPublicDTO;
use App\Services\SpecimenService;

class SpecimenController
{
    public function __construct(
        private readonly SpecimenService $service
    ) {
    }

    /**
     * GET http://localhost:8000/api/v1/specimens
     *
     * Devuelve todos los especímenes utilizando
     * el DTO público, ocultando incubMin y recipes.
     */
    public function index(): void
    {
        $specimens = $this->service->getAll();

        $result = [];

        foreach ($specimens as $specimen) {
            $result[] = $this->toPublicDTO($specimen);
        }

        $this->jsonResponse($result);
    }

    /**
     * GET http://localhost:8000/api/v1/specimens/Specimen_A_01
     *
     * Devuelve un espécimen concreto utilizando
     * el DTO público.
     */
    public function show(string $specimen): void
    {
        $data = $this->service->getBySpecimen($specimen);

        if ($data === null) {
            $this->jsonResponse(
                ['error' => 'Specimen not found'],
                404
            );
            return;
        }

        $this->jsonResponse(
            $this->toPublicDTO($data)
        );
    }

    /**
     * Convierte los datos originales al DTO completo.
     *
     * Este DTO puede utilizarse internamente cuando
     * necesitemos trabajar con todos los campos.
     */
    private function toDTO(array $data): SpecimenDTO
    {
        return new SpecimenDTO(
            specimen: (string) $data['Specimen'],
            name: (string) $data['Name'],
            spX100: (int) $data['spX100'],
            odds: (int) $data['odds'],
            dna: (string) $data['dna'],
            lifePoint: (int) $data['lifePoint'],
            incubMin: (int) $data['incubMin'],
            atk1: (string) $data['atk1'],
            atk1p: (string) $data['atk1p'],
            atk2: (string) $data['atk2'],
            atk2p: (string) $data['atk2p'],
            bank: (int) $data['bank'],
            unlockAttack: (string) $data['unlockAttack'],
            type: (string) $data['type'],
            recipes: (string) $data['recipes'],
            abilities: (string) $data['abilities'],
            abilityPct1: (int) $data['abilityPct1'],
            abilityPct2: (int) $data['abilityPct2'],
            orbSlots: (string) $data['orbSlots'],
            attack1pName: (string) $data['Attack1p_name'],
            attack2pName: (string) $data['Attack2p_name'],
            description: (string) $data['Description']
        );
    }

    /**
     * Convierte los datos originales al DTO público.
     *
     * Este DTO oculta incubMin y recipes.
     */
    private function toPublicDTO(array $data): SpecimenPublicDTO
    {
        return new SpecimenPublicDTO(
        //  specimen: (string) $data['Specimen'],
            name: (string) $data['Name'],
            spX100: (int) $data['spX100'],
            odds: (int) $data['odds'],
            dna: (string) $data['dna'],
            lifePoint: (int) $data['lifePoint'],
            atk1: (string) $data['atk1'],
            atk1p: (string) $data['atk1p'],
            atk2: (string) $data['atk2'],
            atk2p: (string) $data['atk2p'],
            bank: (int) $data['bank'],
            unlockAttack: (string) $data['unlockAttack'],
            type: (string) $data['type'],
            abilities: (string) $data['abilities'],
            abilityPct1: (int) $data['abilityPct1'],
            abilityPct2: (int) $data['abilityPct2'],
            orbSlots: (string) $data['orbSlots'],
            attack1pName: (string) $data['Attack1p_name'],
            attack2pName: (string) $data['Attack2p_name'],
            description: (string) $data['Description']
        );
    }

    /**
     * Envía una respuesta JSON.
     */
    private function jsonResponse(
        mixed $data,
        int $statusCode = 200
    ): void {
        http_response_code($statusCode);

        header('Content-Type: application/json; charset=utf-8');

        echo json_encode(
            $data,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_PRETTY_PRINT
        );
    }
}