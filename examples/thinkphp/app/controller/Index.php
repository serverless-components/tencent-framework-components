<?php
namespace app\controller;

use app\BaseController;

class Index extends BaseController
{
    public function index()
    {
        return '<style type="text/css">*{ padding: 0; margin: 0; } div{ padding: 4px 48px;} a{color:#2E5CD5;cursor: pointer;text-decoration: none} a:hover{text-decoration:underline; } body{ background: #fff; font-family: "Century Gothic","Microsoft yahei"; color: #333;font-size:18px;} h1{ font-size: 60px; font-weight: normal; margin-bottom: 12px; } p{ line-height: 1.6em; font-size: 42px }</style><div style="padding: 24px 48px;"> <h1>:) Welcome To Serverless ThinkPHP Application!</h1><p> ThinkPHP V' . \think\facade\App::version() . '<br/><a target="_blank" href="https://github.com/serverless-components/tencent-thinkphp">说明文档</a>';
    }

    public function hello($name = 'ThinkPHP6')
    {
        return 'Welcome To Serverless ThinkPHP Application! Hello ' . $name;
    }
}
