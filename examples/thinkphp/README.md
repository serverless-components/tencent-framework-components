[![Tencent ThinkPHP Serverless Component](https://img.serverlesscloud.cn/2020310/1583829094880-thinkPHP_%E9%95%BF.png)](http://serverless.com)

# 腾讯云 ThinkPHP Serverless Component

简体中文 | [English](https://github.com/serverless-components/tencent-thinkphp/blob/master/README.en.md)

## 简介

腾讯云 [ThinkPHP](https://github.com/top-think/think) Serverless Component, 支持 Restful API 服务的部署。

> 注意：支持 ThinkPHP >= 6.x

## 目录

0. [准备](#0-准备)
1. [安装](#1-安装)
1. [配置](#2-配置)
1. [部署](#3-部署)
1. [移除](#4-移除)

### 0. 准备

#### 初始化 ThinkPHP 项目

在使用此组件之前，你需要先自己初始化一个 `ThinkPHP` 项目

```bash
$ composer create-project topthink/think serverless-thinkphp
```

> 注意：ThinkPHP 使用 Composer 管理依赖的，所以你需要先自行安装 Composer，请参考 [官方安装文档](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-macos)

### 1. 安装

通过 npm 全局安装 [serverless cli](https://github.com/serverless/serverless)

```bash
$ npm install -g serverless
```

### 2. 配置

在项目根目录，创建 `serverless.yml` 文件，在其中进行如下配置

```bash
$ touch serverless.yml
```

```yml
# serverless.yml
org: orgDemo
app: appDemo
stage: dev
component: thinkphp
name: thinkphpDemo

inputs:
  src: ./ # (optional) path to the source folder. default is a hello world app.
  region: ap-guangzhou
  runtime: Php7
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
```

- [更多配置](https://github.com/serverless-components/tencent-thinkphp/tree/master/docs/configure.md)

### 3. 部署

> 注意：**在部署前，你需要先清理本地运行的配置缓存，执行 `php think clear` 即可。**

如您的账号未 [登陆](https://cloud.tencent.com/login) 或 [注册](https://cloud.tencent.com/register) 腾讯云，您可以直接通过 `微信` 扫描命令行中的二维码进行授权登陆和注册。

通过 `sls` 命令进行部署，并可以添加 `--debug` 参数查看部署过程中的信息

```bash
$ sls deploy --debug
```

> 注意: `sls` 是 `serverless` 命令的简写。

### 4. 移除

通过以下命令移除部署的 API 网关

```bash
$ sls remove --debug
```

### 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此 [注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取 `SecretId` 和`SecretKey`.

```text
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

### 更多组件

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。
