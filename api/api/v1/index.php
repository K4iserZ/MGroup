<?php
// Permitir solicitudes desde Blogger
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejar petición PREFLIGHT (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/src/DTO/SpecimenDTO.php';
require_once __DIR__ . '/src/DTO/SpecimenPublicDTO.php';
require_once __DIR__ . '/src/services/SpecimenService.php';
require_once __DIR__ . '/src/controllers/SpecimenController.php';
require_once __DIR__ . '/src/DTO/SpecimenSummaryDTO.php';
require_once __DIR__ . '/routes.php';