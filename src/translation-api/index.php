<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include 'config.php';
include 'translate.php';

$translate = new Translate();
$translate->select_server();
$translation = $translate->json();
echo $translation;