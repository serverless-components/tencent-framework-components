<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));
define('TEXT_REG', '#\.html.*|\.js.*|\.css.*|\.html.*#');
define('BINARY_REG', '#\.ttf.*|\.woff.*|\.woff2.*|\.gif.*|\.jpg.*|\.png.*|\.jepg.*|\.swf.*|\.bmp.*|\.ico.*#');

// auto make dir /tmp/storage/framework/views
system("mkdir -p /tmp/storage/framework/views");

function consoleLog($prefix, $var)
{
  echo $prefix . ": " . json_encode($var) . "\n";
}

/**
 * handler static files
 */
function handlerStatic($path, $isBase64Encoded)
{
  $filename = __DIR__ . "/public" . $path;
  if (!file_exists($filename)) {
    return [
      "isBase64Encoded" => false,
      "statusCode" => 404,
      "headers" => [
        'Content-Type'  => '',
      ],
      "body" => "404 Not Found",
    ];
  }
  $handle   = fopen($filename, "r");
  $contents = fread($handle, filesize($filename));
  fclose($handle);

  $base64Encode = false;
  $headers = [
    'Content-Type'  => '',
    'Cache-Control' => "max-age=8640000",
    'Accept-Ranges' => 'bytes',
  ];
  $body = $contents;
  if ($isBase64Encoded || preg_match(BINARY_REG, $path)) {
    $base64Encode = true;
    $headers = [
      'Content-Type'  => '',
      'Cache-Control' => "max-age=86400",
    ];
    $body = base64_encode($contents);
  }
  return [
    "isBase64Encoded" => $base64Encode,
    "statusCode" => 200,
    "headers" => $headers,
    "body" => $body,
  ];
}

function initEnvironment($isBase64Encoded)
{
  $envName = '';
  if (file_exists(__DIR__ . "/.env")) {
    $envName = '.env';
  } elseif (file_exists(__DIR__ . "/.env.production")) {
    $envName = '.env.production';
  } elseif (file_exists(__DIR__ . "/.env.local")) {
    $envName = ".env.local";
  }
  if (!$envName) {
    return [
      'isBase64Encoded' => $isBase64Encoded,
      'statusCode' => 500,
      'headers' => [
        'Content-Type' => 'application/json'
      ],
      'body' => $isBase64Encoded ? base64_encode([
        'error' => "Dotenv config file not exist"
      ]) : [
        'error' => "Dotenv config file not exist"
      ]
    ];
  }

  $dotenv = Dotenv\Dotenv::createImmutable(__DIR__, $envName);
  $dotenv->load();
}

function decodeFormData($rawData)
{
  require_once __DIR__ . '/sl_arr.php';

  $files = array();
  $data = array();
  $boundary = substr($rawData, 0, strpos($rawData, "\r\n"));
  // Fetch and process each part
  $parts = array_slice(explode($boundary, $rawData), 1);
  foreach ($parts as $part) {
    // If this is the last part, break
    if ($part == "--\r\n") {
      break;
    }
    // Separate content from headers
    $part = ltrim($part, "\r\n");
    list($rawHeaders, $content) = explode("\r\n\r\n", $part, 2);
    $content = substr($content, 0, strlen($content) - 2);
    // Parse the headers list
    $rawHeaders = explode("\r\n", $rawHeaders);
    $headers = array();
    foreach ($rawHeaders as $header) {
      list($name, $value) = explode(':', $header);
      $headers[strtolower($name)] = ltrim($value, ' ');
    }
    // Parse the Content-Disposition to get the field name, etc.
    if (isset($headers['content-disposition'])) {
      $filename = null;
      preg_match('/^form-data; *name="([^"]+)"(; *filename="([^"]+)")?/', $headers['content-disposition'], $matches);
      $fieldName = $matches[1];
      $fileName = (isset($matches[3]) ? $matches[3] : null);
      // consoleLog('Upload Filename', $fileName);
      // If we have a file, save it. Otherwise, save the data.
      if ($fileName !== null) {
        $localFileName = tempnam('/tmp', 'sls');
        file_put_contents($localFileName, $content);

        $arr = array(
          'name' => $fileName,
          'type' => $headers['content-type'],
          'tmp_name' => $localFileName,
          'error' => 0,
          'size' => filesize($localFileName)
        );

        if (substr($fieldName, -2, 2) == '[]') {
          $fieldName = substr($fieldName, 0, strlen($fieldName) - 2);
        }

        if (array_key_exists($fieldName, $files)) {
          array_push($files[$fieldName], $arr);
        } else {
          $files[$fieldName] = $arr;
        }

        // register a shutdown function to cleanup the temporary file
        register_shutdown_function(function () use ($localFileName) {
          unlink($localFileName);
        });
      } else {
        parse_str($fieldName . '=__INPUT__', $parsedInput);
        $dottedInput = Arr::dot($parsedInput);
        $targetInput = Arr::add([], array_keys($dottedInput)[0], $content);

        $data = array_merge_recursive($data, $targetInput);
      }
    }
  }
  return (object)([
    'data' => $data,
    'files' => $files
  ]);
}

function getHeadersContentType($headers) {
  if (isset($headers['Content-Type'])) {
    return $headers['Content-Type'];
  } else if (isset($headers['content-type'])) {
    return $headers['content-type'];
  }
  return '';
}

function handler($event, $context)
{
  require __DIR__ . '/vendor/autoload.php';

  $isBase64Encoded = $event->isBase64Encoded;


  initEnvironment($isBase64Encoded);

  $app = require __DIR__ . '/bootstrap/app.php';

  // change storage path to APP_STORAGE in dotenv
  $app->useStoragePath( env( 'APP_STORAGE', base_path() . '/storage' ) );


  // init path
  $path = str_replace("//", "/", $event->path);

  if (preg_match(TEXT_REG, $path) || preg_match(BINARY_REG, $path)) {
    return handlerStatic($path, $isBase64Encoded);
  }

  // init headers
  $headers = $event->headers ?? [];
  $headers = json_decode(json_encode($headers), true);

  // consoleLog("Event", $event);

  // init request data
  $data = [];
  $rawBody = $event->body ?? null;
  if ($event->httpMethod === 'GET') {
    $data = !empty($event->queryString) ? $event->queryString : [];
  } else {
    if ($isBase64Encoded) {
      $rawBody = base64_decode($rawBody);
    }
    $contentType = getHeadersContentType($headers);
    if (preg_match('/multipart\/form-data/', $contentType)) {
      $requestData = !empty($rawBody) ? decodeFormData($rawBody) : [];
      // consoleLog('Post File', $requestData);
      $data = $requestData->data;
      $files = $requestData->files;
    } else if (preg_match('/application\/x-www-form-urlencoded/', $contentType)) {
      if (!empty($rawBody)) {
        mb_parse_str($rawBody, $data);
      }
    } else {
      $data = !empty($rawBody) ? json_decode($rawBody, true) : [];
    }
  }

  // consoleLog('Request Data', $data);
  // consoleLog('Raw Body', $rawBody);

  // execute laravel app request, get response
  $kernel = $app->make(Kernel::class);

  $request = Request::create($path, $event->httpMethod, (array) $data, [], [], $headers, $rawBody);
  if (!empty($files)) {
    $request->files->add($files);
  }
  $response = $kernel->handle(
    $request
  );

  // init content
  $body = $response->getContent();
  $contentType = $response->headers->get('Content-Type');

  return [
    'isBase64Encoded' => $isBase64Encoded,
    'statusCode' => $response->getStatusCode() ?? 200,
    'headers' => [
      'Content-Type' => $contentType
    ],
    'body' => $isBase64Encoded ? base64_encode($body) : $body
  ];
}
