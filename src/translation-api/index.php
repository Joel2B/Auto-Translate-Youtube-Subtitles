<?php

include 'config.php';
include 'translate.php';

$translate = new Translate();

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

echo $translate->json();