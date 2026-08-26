<?php

namespace App\Controllers;

use App\Services\SpecimenService;

class SpecimenController
{
    public function __construct(
        private readonly SpecimenService $service
    ) {
    }

    /**
     * GET /api/v1/specimens
     * Lista ligera para las tarjetas del frontend
     */
    public function index(): void
    {
        $summaries = $this->service->getSummaries();
        $this->jsonResponse($summaries);
    }

    /**
     * GET /api/v1/specimens/{specimen}
     * Detalle completo del espécimen usando SpecimenPublicDTO
     */
    public function show(string $specimen): void
    {
        $data = $this->service->getPublicBySpecimen($specimen);

        if ($data === null) {
            $this->jsonResponse(
                ['error' => 'Specimen not found'],
                404
            );
            return;
        }

        $this->jsonResponse($data);
    }

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