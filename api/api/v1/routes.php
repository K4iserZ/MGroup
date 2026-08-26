<?php

use App\Controllers\SpecimenController;
use App\Controllers\GachaController;
use App\Controllers\OfferController;
use App\Services\GachaService;
use App\Services\OfferService;
use App\Services\SpecimenService;

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

/**
 * --------------------------------------------------------------------------
 * GET /api/v1/gacha
 * --------------------------------------------------------------------------
 *
 * Devuelve el JSON de gacha sin transformar su estructura.
 *
 * Prueba:
 * http://localhost:8000/api/v1/gacha
 */
if ($method === 'GET' && $uri === '/api/v1/gacha') {

    $controller = new GachaController(
        new GachaService()
    );

    $controller->index();

    exit;
}

/**
 * --------------------------------------------------------------------------
 * GET /api/v1/offers/specimen/{id}
 * --------------------------------------------------------------------------
 *
 * Busca ofertas que contienen el specimen indicado en articles[].typeId.
 */
if (
    $method === 'GET' &&
    preg_match('#^/api/v1/offers/specimen/([^/]+)$#', $uri, $matches)
) {
    $controller = new OfferController(
        new OfferService()
    );

    $controller->findBySpecimen(urldecode($matches[1]));

    exit;
}

/**
 * --------------------------------------------------------------------------
 * GET /api/v1/specimens
 * --------------------------------------------------------------------------
 *
 * Devuelve la lista ligera de especímenes utilizando SpecimenSummaryDTO.
 *
 * Prueba:
 * http://localhost:8000/api/v1/specimens
 * http://mgfree.rf.gd/api/v1/specimens
 */
if ($method === 'GET' && $uri === '/api/v1/specimens') {

    $controller = new SpecimenController(
        new SpecimenService()
    );

    $controller->index();

    exit;
}

/**
 * --------------------------------------------------------------------------
 * GET /api/v1/specimens/{specimen}
 * --------------------------------------------------------------------------
 *
 * Devuelve un espécimen concreto con sus detalles mediante SpecimenPublicDTO.
 *
 * Ejemplo:
 * http://localhost:8000/api/v1/specimens/Specimen_A_01
 */
if (
    $method === 'GET' &&
    preg_match('#^/api/v1/specimens/([^/]+)$#', $uri, $matches)
) {

    $specimen = $matches[1];

    $controller = new SpecimenController(
        new SpecimenService()
    );

    $controller->show($specimen);

    exit;
}

/**
 * --------------------------------------------------------------------------
 * 404 - Not Found
 * --------------------------------------------------------------------------
 */
http_response_code(404);

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'error' => 'Endpoint not found'
]);