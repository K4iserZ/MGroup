<?php

namespace App\DTO;

class OfferPublicDTO
{
    public function __construct(
        public readonly string $offerId,
        public readonly string $name,
        public readonly string $picture,
        public readonly array $specimen,
        public readonly array $history
    ) {
    }

    public static function fromArray(
        string $offerId,
        array $offer,
        array $specimen
    ): self {
        $history = [];
        $prices = $offer['historial_precios'] ?? [];

        if (is_array($prices)) {
            foreach ($prices as $price) {
                if (!is_array($price)) {
                    continue;
                }

                $history[] = [
                    'fecha' => (string) ($price['fecha'] ?? ''),
                    'cost_type' => (string) ($price['cost_type'] ?? ''),
                    'cost_amount' => (string) ($price['cost_amount'] ?? ''),
                    'real_prices' => is_array($price['real_prices'] ?? null)
                        ? $price['real_prices']
                        : [],
                    'mobile_prices' => is_array($price['mobile_prices'] ?? null)
                        ? $price['mobile_prices']
                        : []
                ];
            }
        }

        return new self(
            offerId: $offerId,
            name: (string) ($offer['name'] ?? ''),
            picture: (string) ($offer['picture'] ?? ''),
            specimen: $specimen,
            history: $history
        );
    }

    public function toArray(): array
    {
        return [
            'offer_id' => $this->offerId,
            'name' => $this->name,
            'picture' => $this->picture,
            'specimen' => $this->specimen,
            'history' => $this->history
        ];
    }
}