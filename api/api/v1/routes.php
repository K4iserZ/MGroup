<?php

use App\Controllers\SpecimenController;
use App\Services\SpecimenService;

$method = $_SERVER['REQUEST_METHOD'];

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);


/**
 * --------------------------------------------------------------------------
 * GET /api/v1/specimens
 * --------------------------------------------------------------------------
 *
 * Devuelve todos los especímenes utilizando SpecimenPublicDTO.
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
 * GET /api/v1/specimens/{Specimen}
 * --------------------------------------------------------------------------
 *
 * Devuelve un espécimen concreto utilizando SpecimenPublicDTO.
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
 * 404
 * --------------------------------------------------------------------------
 */
http_response_code(404);

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'error' => 'Endpoint not found'
]);