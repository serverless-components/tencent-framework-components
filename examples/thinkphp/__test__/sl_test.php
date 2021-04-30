<?php

require_once __DIR__ . '/sl_handler.php';

$event = (object) [
  "isBase64Encoded" => false,
  "requestContext" => [
    "serviceId" => "service-abcdefg",
    "path" => "/event",
    "httpMethod" => "GET",
    "requestId" => "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
    "sourceIp" => "10.0.2.14",
    "stage" => "release"
  ],
  "headers" => [
    "accept-Language" => "en-US,en,cn",
    "accept" => "text/html,application/xml,application/json",
    "host" => "localhost",
    "user-Agent" => "User Agent String"
  ],
  "pathParameters" => [
    "path" => "value"
  ],
  "queryStringParameters" => [
    "foo" => "bar"
  ],
  "headerParameters" => [
    "Refer" => "127.0.0.1"
  ],
  "stageVariables" => [
    "stage" => "release"
  ],
  "path" => "/event",
  "queryString" => [
    "foo"  => "bar",
    "bob"  => "alice"
  ],
  "httpMethod" => "GET"
];


$res = handler($event, null);

var_dump($res);
