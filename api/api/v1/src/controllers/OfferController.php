<?php

namespace App\Controllers;

use App\DTO\OfferPublicDTO;
use App\Services\OfferService;

class OfferController
{
    public function __construct(
        private readonly OfferService $service
    ) {
    }

    /**
     * GET /api/v1/offers/specimen/{id}
     */
    public function findBySpecimen(string $specimen): void
    {
        $specimen = trim($specimen);

        if ($specimen === '' || !preg_match('/^Specimen_[A-Za-z0-9_]+$/', $specimen)) {
            $this->jsonResponse(['error' => 'Invalid specimen id'], 400);
            return;
        }

        try {
            $offers = $this->service->findOffersContaining($specimen);
            $this->jsonResponse([
                'specimen' => $specimen,
                'total_offers' => count($offers),
                'offers' => array_map(
                    fn(OfferPublicDTO $offer) => $offer->toArray(),
                    $offers
                )
            ]);
        } catch (\Throwable $error) {
            error_log($error->getMessage());
            $this->jsonResponse(['error' => 'Unable to retrieve offers'], 500);
        }
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