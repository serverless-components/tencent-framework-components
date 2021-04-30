<?php
namespace app\controller;

use app\BaseController;
use think\Request;
use think\facade\View;

class Index extends BaseController
{
    public function index()
    {
      return View::fetch('index');
    }

    public function hello($name = 'ThinkPHP6')
    {
        return 'Welcome To Serverless ThinkPHP Application! Hello ' . $name;
    }

    public function getPosts(Request $request)
    {
      $inputs = $request->get();
      return json([
        "title" => 'serverless',
        "get" => $inputs
      ]);
    }

    public function createPost(Request $request) {
      $inputs = $request->post();
      return json([
        "title" => 'serverless',
        "post" => $inputs
      ]);
    }

    public function upload(Request $request) {
      $avatar = $request->file('avatar');
      if ($avatar) {
        $savename = \think\facade\Filesystem::putFile('avatar', $avatar);
      }

      return json([
        "title" => 'serverless',
        "upload" => $savename ?? null
      ]);
    }

    public function event(Request $request) {
      $event = $request->__SLS_EVENT__;
      return json([
        "event" => $event,
      ]);
    }
}
