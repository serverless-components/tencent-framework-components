# 配置文档

## 全部配置

```yml
# serverless.yml

app: appDemo # (可选) 用于记录组织信息. 默认与name相同，必须为字符串
stage: dev # (可选) 用于区分环境信息，默认值是 dev

component: express # (必选) 组件名称
name: webDemo # 必选) 组件实例名称.

inputs:
  region: ap-guangzhou # 云函数所在区域
  src: # 部署src下的文件代码，并打包成zip上传到bucket上
    src: ./ # 本地需要打包的文件目录
    exclude: # 被排除的文件或目录
      - .env
      - 'node_modules/**'
  # src: # 在指定存储桶bucket中已经存在了object代码，直接部署
  #   bucket: bucket01 # bucket name，当前会默认在bucket name后增加 appid 后缀, 本例中为 bucket01-appid
  #   object: cos.zip  # bucket key 指定存储桶内的文件
  functionConf: # 函数配置相关
    entryFile: sls.js # 自定义 server 的入口文件名，默认为 sls.js，如果不想修改文件名为 sls.js 可以自定义
    projectName: djangodemo # 只有 django 组件配置必须
    name: webDemo # 云函数名称
    runtime: Nodejs10.15 # 运行环境
    timeout: 10 # 超时时间，单位秒
    eip: false # 是否固定出口IP
    memorySize: 128 # 内存大小，单位MB
    asyncRunEnable: false # 是否启用异步执行（长时间运行）
    traceEnable: false # 是否状态追踪
    environment: #  环境变量
      variables: #  环境变量数组
        TEST: vale
    vpc: # 私有网络配置
      vpcId: 'vpc-xxx' # 私有网络的Id
      subnetId: 'subnet-xxx' # 子网ID
    tags:
      tagKey: tagValue
    layers:
      - name: layerName #  layer名称
        version: 1 #  版本
    cls: # 日志配置
      logsetId: 'xxx' # 日志集 ID
      topicId: 'xxx' # 日志主题 ID
  apigatewayConf: #  api网关配置
    isDisabled: false # 是否禁用自动创建 API 网关功能
    qualifier: $LATEST
    id: service-np1uloxw # api网关服务ID
    name: serverless # api网关服务名称
    description: serverless apigw # api网关服务描述
    timeout: 15 # api 超时时间
    cors: true #  允许跨域
    protocols:
      - http
      - https
    environment: test
    customDomains: # 自定义域名绑定
      - domain: abc.com # 待绑定的自定义的域名
        certificateId: abcdefg # 待绑定自定义域名的证书唯一 ID
        isForcedHttps: true # 是否强制https，如果为true，必须配置 certificateId (SSL证书 ID)
        # 如要设置自定义路径映射，请设置为 false
        isDefaultMapping: false
        # 自定义路径映射的路径。使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。
        pathMappingSet:
          - path: /
            environment: release
        protocols: # 绑定自定义域名的协议类型，默认与服务的前端协议一致。
          - http # 支持http协议
          - https # 支持https协议
    usagePlan: #  用户使用计划
      usagePlanId: 1111
      usagePlanName: slscmp
      usagePlanDesc: sls create
      maxRequestNum: 1000
    auth: #  密钥
      secretName: secret
      secretIds:
        - xxx
  # 通常是为了部署 ssr 框架编译生成的静态文件
  staticConf:
    cosConf:
      bucket: static-bucket
      sources:
        - src: public
          targetDir: /
    cdnConf:
      area: mainland
      domain: cnode.yuga.chat
      autoRefresh: true
      refreshType: delete
      forceRedirect:
        switch: on
        redirectType: https
        redirectStatusCode: 301
      https:
        http2: on
        certId: 'abc'
```

`component` 支持的框架组件如下：

- [x] express
- [x] koa
- [x] egg
- [x] nextjs
- [x] nuxtjs
- [x] nestjs
- [x] flask
- [x] django
- [x] laravel
- [x] thinkphp

> 注意：`entryFile` 仅 `Node.js` 框架组件支持，`funcitonConf.projectName` 仅 `Django` 框架支持

## inputs 配置参数

主要的参数

| 参数名称       | 必选 | 类型                      |     默认值      | 描述              |
| -------------- | :--: | :------------------------ | :-------------: | :---------------- |
| region         |  否  | string                    | `ap-guangzhou`  | 项目部署所在区域  |
| src            |  否  | [Src](#Src)               | `process.cwd()` | 项目代码配置      |
| functionConf   |  否  | [Function](#Function)     |                 | 函数配置          |
| apigatewayConf |  否  | [Apigateway](#Apigateway) |                 | API 网关配置      |
| staticConf     |  否  | [Static](#Static)         |                 | 静态资源 CDN 配置 |

## Src

项目代码配置

| 参数名称 | 必选 |   类型   | 默认值 | 描述                                                                                                                                                                                 |
| -------- | :--: | :------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src      |  否  |  string  |        | 代码路径。与 object 不能同时存在。                                                                                                                                                   |
| exclude  |  否  | string[] |        | 不包含的文件或路径, 遵守 [glob 语法][glob]                                                                                                                                           |
| bucket   |  否  |  string  |        | bucket 名称。如果配置了 src，表示部署 src 的代码并压缩成 zip 后上传到 bucket-appid 对应的存储桶中；如果配置了 object，表示获取 bucket-appid 对应存储桶中 object 对应的代码进行部署。 |
| object   |  否  |  string  |        | 部署的代码在存储桶中的路径。                                                                                                                                                         |

### Function

函数配置

| 参数名称       | 必选 | 类型                        |    默认值     | 描述                                                                                                                               |
| -------------- | :--: | :-------------------------- | :-----------: | :--------------------------------------------------------------------------------------------------------------------------------- |
| entryFile      |  否  | string                      |   `sls.js`    | 函数的入口文件名                                                                                                                   |
| runtime        |  否  | string                      | `Nodejs10.15` | 执行环境, 支持: Nodejs6.10, Nodejs8.9, Nodejs10.15, Nodejs12.16                                                                    |
| timeout        |  否  | number                      |      `3`      | 函数最长执行时间，单位为秒，可选值范围 1-900 秒，默认为 3 秒                                                                       |
| memorySize     |  否  | number                      |     `128`     | 函数运行时内存大小，默认为 128M，可选范围 64、128MB-3072MB，并且以 128MB 为阶梯                                                    |
| environment    |  否  | [Environment](#Environment) |               | 函数的环境变量                                                                                                                     |
| vpc            |  否  | [Vpc](#Vpc)                 |               | 函数的 VPC 配置                                                                                                                    |
| layers         |  否  | [Layer](#Layer)[]           |               | 云函数绑定的 layer                                                                                                                 |
| tags           |  否  | object                      |               | 云函数标签，`key-value` 形式配置                                                                                                   |
| eip            |  否  | boolean                     |    `false`    | 是否固定出口 IP                                                                                                                    |
| asyncRunEnable |  否  | boolean                     |    `false`    | 是否启用异步执行（长时间运行），默认最大支持 `12小时`，如果配置为 `true`，`cls`（函数日志配置） 必须，此参数只有在函数创建时才有效 |
| traceEnable    |  否  | boolean                     |    `false`    | 是否启用状态追踪，如果要配置为 `true`，必须配置 `asyncRunEnable` 同时为 `true`                                                     |

> 此处只是列举，`faas` 参数支持 [scf][scf-config] 组件的所有基础配置（ `events` 除外）

`runtime` 运行环境说明：

```
Nodejs 框架支持：Nodejs6.10, Nodejs8.9, Nodejs10.15, Nodejs12.16
Python 框架支持：Python3.6, Python2.7
PHP    框架支持：Php7，Php5
```

##### Layer

层配置

| 参数名称 | 必选 |  类型  | 默认值 | 描述     |
| -------- | :--: | :----: | :----: | :------- |
| name     |  否  | string |        | 层名称   |
| version  |  否  | string |        | 层版本号 |

##### Environment

环境变量

| 参数名称  | 类型   | 描述                                      |
| --------- | ------ | :---------------------------------------- |
| variables | object | 环境变量参数, 包含多对 key-value 的键值对 |

##### Vpc

VPC 配置

| 参数名称 | 类型   | 描述        |
| -------- | ------ | :---------- |
| vpcId    | string | 私有网络 ID |
| subnetId | string | 子网 ID     |

### Apigateway

API 网关配置

| 参数名称        | 必选 | 类型                            | 默认值       | 描述                                                             |
| --------------- | :--: | :------------------------------ | :----------- | :--------------------------------------------------------------- |
| id              |  否  | string                          |              | API 网关服务 ID, 如果存在将使用这个 API 网关服务                 |
| name            |  否  | string                          | `serverless` | API 网关服务名称, 默认创建一个新的服务名称                       |
| description     |  否  | string                          | `serverless` | API 网关服务描述                                                 |
| protocols       |  否  | string[]                        | `['http']`   | 前端请求的类型，如 http，https，http 与 https                    |
| environment     |  否  | string                          | `release`    | 发布环境. 网关环境: test, prepub 与 release                      |
| cors            |  否  | boolean                         | `false`      | 开启跨域。默认值为否。                                           |
| timeout         |  否  | number                          | `15`         | Api 超时时间，单位: 秒                                           |
| isDisabled      |  否  | boolean                         | `false`      | 关闭自动创建 API 网关功能。默认值为否，即默认自动创建 API 网关。 |
| isBase64Encoded |  否  | boolean                         | `false`      | 是否开启 Base64 编码，如果需要文件上传，请配置为 `true`          |
| qualifier       |  否  | string                          | `$DEFAULT`   | API 网关触发器指向的函数所属别名，默认为 `$DEFAULT` 默认流量     |
| usagePlan       |  否  | [UsagePlan](#UsagePlan)         |              | 使用计划配置                                                     |
| auth            |  否  | [ApuAuth](#ApiAuth)             |              | API 密钥配置                                                     |
| customDomain    |  否  | [CustomDomain](#CustomDomain)[] |              | 自定义 API 域名配置                                              |

##### UsagePlan

使用计划配置

参考: https://cloud.tencent.com/document/product/628/14947

| 参数名称      | 必选 | 类型   | 描述                                                    |
| ------------- | :--: | :----- | :------------------------------------------------------ |
| usagePlanId   |  否  | string | 用户自定义使用计划 ID                                   |
| usagePlanName |  否  | string | 用户自定义的使用计划名称                                |
| usagePlanDesc |  否  | string | 用户自定义的使用计划描述                                |
| maxRequestNum |  否  | number | 请求配额总数，如果为空，将使用-1 作为默认值，表示不开启 |

##### ApiAuth

API 密钥配置

| 参数名称   | 必选 | 类型     | 描述     |
| ---------- | :--: | :------- | :------- |
| secretName |  是  | string   | 密钥名称 |
| secretIds  |  否  | string[] | 密钥 ID  |

##### CustomDomain

自定义域名配置

| 参数名称         | 必选 | 类型                  | 默认值  | 描述                                                                                |
| ---------------- | :--: | :-------------------- | :-----: | :---------------------------------------------------------------------------------- |
| domain           |  是  | string                |         | 待绑定的自定义的域名。                                                              |
| protocol         |  否  | string[]              |         | 绑定自定义域名的协议类型，默认与服务的前端协议一致。                                |
| certificateId    |  否  | string                |         | 待绑定自定义域名的证书 ID，如果设置了 `protocol` 含有 https，则为必选               |
| isDefaultMapping |  否  | boolean               | `true`  | 是否使用默认路径映射。为 `false` 时，表示自定义路径映射，此时 pathMappingSet 必填。 |
| pathMappingSet   |  否  | [PathMap](#PathMap)[] |  `[]`   | 自定义路径映射的路径。                                                              |
| isForcedHttps    |  否  | boolean               | `false` | 是否强制 HTTPS。                                                                    |

> 注意：使用自定义映射时，可一次仅映射一个 path 到一个环境，也可映射多个 path 到多个环境。并且一旦使用自定义映射，原本的默认映射规则不再生效，只有自定义映射路径生效。

###### PathMap

自定义路径映射

| 参数名称    | 必选 | 类型   | Description    |
| ----------- | :--: | :----- | :------------- |
| path        |  是  | string | 自定义映射路径 |
| environment |  是  | string | 自定义映射环境 |

### Static

静态资源配置

| 参数名称 | 必选 |    类型     | 默认值 | 描述     |
| -------- | :--: | :---------: | :----: | :------- |
| cosConf  |  是  | [Cos](#Cos) |        | COS 配置 |
| cdnConf  |  否  | [Cdn](#Cdn) |        | CDN 配置 |

##### Cos

COS 配置

| 参数名称 | 必选 |        类型         |                  默认值                   | 描述                          |
| -------- | :--: | :-----------------: | :---------------------------------------: | :---------------------------- |
| bucket   |  是  |       string        |                                           | COS 存储同名称                |
| sources  |  否  | [Source](#Source)[] | `[{ "src": "public", "targetDir": "/" }]` | 需要托管到 COS 的静态资源目录 |

###### Source

静态资源目录配置

| 参数名称  | 必选 |  类型  | 默认值 | 描述                  |
| --------- | :--: | :----: | :----: | :-------------------- |
| src       |  是  | string |        | 静态资源目录          |
| targetDir |  否  | string |  `/`   | 上传到 COS 存储桶目录 |

`nextjs` 组件默认 `sources` 配置为：

```json
[
  { "src": ".next/static", "targetDir": "/_next/static" },
  { "src": "public", "targetDir": "/" }
]
```

`nuxtjs` 组件默认 `sources` 配置为：

```json
[
  { "src": ".nuxt/dist/client", "targetDir": "/_next/static" },
  { "src": "public", "targetDir": "/" }
]
```

##### Cdn

CDN 配置

area: mainland domain: cnode.yuga.chat autoRefresh: true refreshType: delete
forceRedirect: switch: on redirectType: https redirectStatusCode: 301 https:
http2: on certId: 'eGkM75xv'

| 参数名称      | 必选 |              类型               |   默认值   | 描述                                                                                        |
| ------------- | :--: | :-----------------------------: | :--------: | :------------------------------------------------------------------------------------------ |
| domain        |  是  |             string              |            | CDN 域名                                                                                    |
| area          |  否  |             string              | `mainland` | 加速区域，mainland: 大陆，overseas：海外，global：全球加速                                  |
| onlyRefresh   |  否  |             boolean             |  `false`   | 是否仅刷新 CDN，第一次部署 CDN 后，如果没有修改 CDN 配置，可以配置此项 `true`，节省部署时间 |
| refreshType   |  否  |             boolean             |  `delete`  | CDN 刷新类型，delete：刷新全部资源，flush：刷新变更资源                                     |
| forceRedirect |  否  | [ForceRedirect](#ForceRedirect) |            | 访问协议强制跳转配置                                                                        |
| https         |  否  |         [Https](#Https)         |            | https 配置                                                                                  |

###### ForceRedirect

访问协议强制跳转配置

| 参数名称           | 必选 |  类型  | 默认值  | 描述                                                           |
| ------------------ | :--: | :----: | :-----: | :------------------------------------------------------------- |
| switch             |  是  | string |  `on`   | 访问强制跳转配置开关, on：开启，off：关闭                      |
| redirectType       |  否  | string | `https` | 访问强制跳转类型，http：强制 http 跳转，https：强制 https 跳转 |
| redirectStatusCode |  否  | number |  `301`  | 强制跳转时返回状态码，支持 301、302                            |

###### Https

HTTPS 配置

| 参数名称 | 必选 |  类型  | 默认值 | 描述                                  |
| -------- | :--: | :----: | :----: | :------------------------------------ |
| certId   |  是  | string |        | 腾讯云托管域名证书 ID                 |
| http2    |  是  | string |        | 是否开启 HTTP2，on： 开启，off： 关闭 |

<!-- links -->

[glob]: https://github.com/isaacs/node-glob
[scf-config]: https://github.com/serverless-components/tencent-scf/tree/master/docs/configure.md
