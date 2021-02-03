<?php

define('TEXT_REG', '#\.html.*|\.js.*|\.css.*|\.html.*#');
define('BINARY_REG', '#\.ttf.*|\.woff.*|\.gif.*|\.jpg.*|\.png.*|\.jepg.*|\.swf.*|\.bmp.*|\.ico.*#');

/**
 * handler static files
 */
function handlerStatic($path)
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
    if (preg_match(BINARY_REG, $path)) {
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

function handler($event, $context)
{
    require __DIR__ . '/vendor/autoload.php';

    // init path
    $path = '/' == $event->path ? '' : ltrim($event->path, '/');

    $filename = __DIR__ . "/public/" . $path;
    if (file_exists($filename) && (preg_match(TEXT_REG, $path) || preg_match(BINARY_REG, $path))) {
        return handlerStatic($path);
    }

    $headers = $event->headers ?? [];
    $headers = json_decode(json_encode($headers), true);

    $_GET = $event->queryString ?? [];
    $_GET = json_decode(json_encode($_GET), true);

    $_SERVER['REQUEST_METHOD'] = $event->httpMethod;


    $_POST = [];

    // init body
    $body = $event->body ?? '';
    if ($event->isBase64Encoded) {
      $body = base64_decode($body);
    }

    if(!empty($body)) {
      $jsonobj = json_decode($body, true);
      if (is_array($jsonobj) && !empty($jsonobj)) {
        foreach ($jsonobj as $k => $v) {
          $_POST[$k] = $v;
        }
      } else {
        $_POSTbody = explode("&", $event->body);
        foreach ($_POSTbody as $postvalues) {
          $tmp=explode("=", $postvalues);
          $_POST[$tmp[0]] = $tmp[1];
        }
      }
    }

    $app = new \think\App();
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

    $body = $response->getContent();
    $contentType = $response->getHeader('Content-Type');

    return [
        'isBase64Encoded' => false,
        'statusCode' => $response->getCode(),
        'headers' => [
            'Content-Type' => $contentType
        ],
        'body' => $body
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
