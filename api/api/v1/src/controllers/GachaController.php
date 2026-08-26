<?php

namespace App\Controllers;

use App\Services\GachaService;

class GachaController
{
    public function __construct(
        private readonly GachaService $service
    ) {
    }

    /**
     * GET /api/v1/gacha
     * Lista completa de entradas de gacha.
     */
    public function index(): void
    {
        http_response_code(200);

        header('Content-Type: application/json; charset=utf-8');

        echo json_encode(
            $this->service->getAll(),
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_PRETTY_PRINT
        );
    }
}