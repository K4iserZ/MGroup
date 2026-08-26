<?php

namespace App\Services;

use App\DTO\OfferPublicDTO;

class OfferService
{
    private ?array $offers = null;

    /**
     * Busca ofertas por el tipo de objeto contenido en articles[].typeId.
     */
    public function findOffersContaining(string $typeId): array
    {
        $this->loadOffers();
        $matches = [];

        foreach ($this->offers as $offerId => $offer) {
            if (!is_array($offer) || !is_array($offer['articles'] ?? null)) {
                continue;
            }

            foreach ($offer['articles'] as $article) {
                if (!is_array($article) || ($article['typeId'] ?? null) !== $typeId) {
                    continue;
                }

                $matches[] = OfferPublicDTO::fromArray(
                    (string) $offerId,
                    $offer,
                    $article
                );
                break;
            }
        }

        return $matches;
    }

    private function loadOffers(): void
    {
        if ($this->offers !== null) {
            return;
        }

        $file = __DIR__ . '/../../data/offersStore.json';

        if (!file_exists($file)) {
            throw new \RuntimeException('Offer data file not found.');
        }

        $json = file_get_contents($file);

        if ($json === false) {
            throw new \RuntimeException('Unable to read offer data.');
        }

        $data = json_decode($json, true);

        if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid offer JSON.');
        }

        $this->offers = $data;
    }
}