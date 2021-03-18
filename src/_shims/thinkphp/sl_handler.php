<?php

use think\App;

define('TEXT_REG', '#\.html.*|\.js.*|\.css.*|\.html.*#');
define('BINARY_REG', '#\.ttf.*|\.woff.*|\.gif.*|\.jpg.*|\.png.*|\.jepg.*|\.swf.*|\.bmp.*|\.ico.*#');

function consoleLog($prefix, $var)
{
  echo $prefix . ": " . json_encode($var) . "\n";
}

/**
 * handler static files
 */
function handlerStatic($path, $isBase64Encoded)
{
  $filename = __DIR__ . "/public/" . $path;
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

    // init path
    $path = '/' == $event->path ? '' : ltrim($event->path, '/');

    $filename = __DIR__ . "/public/" . $path;
    if (file_exists($filename) && (preg_match(TEXT_REG, $path) || preg_match(BINARY_REG, $path))) {
        return handlerStatic($path, $isBase64Encoded);
    }

    $headers = $event->headers ?? [];
    $headers = json_decode(json_encode($headers), true);

    $_GET = $event->queryString ?? [];
    $_GET = json_decode(json_encode($_GET), true);

    $_SERVER['REQUEST_METHOD'] = $event->httpMethod;

    $_POST = [];

    // init body
    $rawBody = $event->body ?? '';
    if ($isBase64Encoded) {
      $rawBody = base64_decode($rawBody);
    }

    // consoleLog('Headers', $headers);
    // consoleLog('Raw Body', $rawBody);

    $contentType = getHeadersContentType($headers);
    $isMultiFormData = preg_match('/multipart\/form-data/', $contentType);

    if(!empty($rawBody)) {
      $jsonobj = json_decode($rawBody, true);
      if (is_array($jsonobj) && !empty($jsonobj)) {
        foreach ($jsonobj as $k => $v) {
          $_POST[$k] = $v;
        }
      } else if ($isMultiFormData) {
        $requestData = !empty($rawBody) ? decodeFormData($rawBody) : [];
        // consoleLog('Post File', $requestData);
        $_POST = $requestData->data;
        $_FILES = $requestData->files;
      } else  {
        $_POSTbody = explode("&", $rawBody);
        foreach ($_POSTbody as $postvalues) {
          $tmp=explode("=", $postvalues);
          $_POST[$tmp[0]] = $tmp[1];
        }
      }
    }

    $app = new App();
    // set runtime path to in /tmp, because only /tmp is writable for cloud
    $app->setRuntimePath('/tmp/runtime' . DIRECTORY_SEPARATOR);

    $http = $app->http;

    // make request
    $request = $app->make('request', [], true);
    $request->setPathinfo($path);
    $request->setMethod($event->httpMethod);
    $request->withHeader($headers);

    // Check if it is running in multi-app
    $isMultiApp = isMultiApp($app);
    if($isMultiApp) {
        $appName = getAppName($path);
        if($appName == '') {
            // if app name not included in the request path,
            // find the default one defined in config/app.php
            include_once $app->getThinkPath() . 'helper.php'; // include helper for env()
            $appName = $app->config->get('app.default_app') ?: 'index';
        } else {
          $request->setPathinfo(strpos($path, '/') ? ltrim(strstr($path, '/'), '/') : '');
        }
        $response = $http->name($appName)->run($request);
    } else {
        $response = $http->run($request);
    }

    // get response
    $http->end($response);

    $content = $response->getContent();
    // consoleLog('Response data', $content);

    $contentType = $response->getHeader('Content-Type');

    return [
        'isBase64Encoded' => $isBase64Encoded,
        'statusCode' => $response->getCode(),
        'headers' => [
            'Content-Type' => $contentType
        ],
        'body' => $isBase64Encoded ? base64_encode($content) : $content
    ];
}

function isMultiApp() : bool
{
  return is_dir(__DIR__ . "/app/" . 'controller') ? false : true;
}

function getAppName($path)
{
    $appname = current(explode('/', $path));
    // check if the folder exists
    $appPath = __DIR__ . "/app/" . $appname;
    if(is_dir($appPath)) {
        return $appname;
    }

    return '';
}
