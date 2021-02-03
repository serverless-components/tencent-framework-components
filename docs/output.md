# 部署 `output` 参数介绍

> 组件输出可以在别的组件中通过 `${output:${stage}:${app}:<name>.<variable_name>}` 获取
>
> 例如，如果该组件名称是 `test_name`, ·且只部署于一个地域，则可以通过 `${output:${stage}:${app}:test_name.apigw.url}` 在别的组件中获取该组件的 API 网关的 `url`。

| 名称        |               类型                | 描述                             |
| :---------- | :-------------------------------: | :------------------------------- |
| templateUrl |              string               | 未提供代码时的模板代码 url       |
| region      |              string               | 地域信息（只有一个地域时才提供） |
| scf         | [FunctionOutput](#FunctionOutput) | 云函数输出信息                   |
| apigw       |    [ApigwOutput](#ApigwOutput)    | API 网关输出信息                 |
| static      |   [StaticOutput](#StaticOutput)   | 静态资源输出信息                 |

## FunctionOutput

云函数输出

| 名称                 |      类型      | 描述                   |
| :------------------- | :------------: | :--------------------- |
| functionName         |     string     | 云函数名称             |
| runtime              |     string     | 云运行环境             |
| namespace            |     string     | 云函数名称空间         |
| lastVersion          |     string     | 云函数版本             |
| traffic              | `number (0~1)` | 将多少流量导向该云函数 |
| configTrafficVersion |     string     |                        |

## ApigwOutput

API 网关输出

| 名称          |              类型               | 描述                       |
| :------------ | :-----------------------------: | :------------------------- |
| serviceId     |             string              | API 网关 ID                |
| subDomain     |             string              | API 网关子域名             |
| enviroment    | `"release" | "prepub" | "test"` | API 网关                   |
| url           |             string              | API 网关对外的完整 URL     |
| traffic       |          number (0~1)           | 将多少流量导向该云函数     |
| customDomains | [CustomDomain](#CustomDomain)[] | API 网关自定义域名输出列表 |

### CustomDomain

API 网关自定义域名输出

| 名称      |  类型  | 描述                            |
| :-------- | :----: | :------------------------------ |
| url       | string | 自定义域名访问链接              |
| subDomain | string | 自定义域名                      |
| cname     | string | 自定义域名需要配置的 cname 记录 |

## StaticOutput

静态资源输出

| 名称 |    类型     | 描述       |
| :--- | :---------: | :--------- |
| cos  | [Cos](#Cos) | 云函数名称 |
| cdn  | [Cdn](#Cdn) | 云运行环境 |

### Cos

COS 配置输出

| 名称      |  类型  | 描述             |
| :-------- | :----: | :--------------- |
| region    | string | 地域             |
| bucket    | string | COS 桶名称       |
| cosOrigin | string | COS 资源访问域名 |

### Cdn

Cdn 配置输出

| 名称   |  类型  | 描述         |
| :----- | :----: | :----------- |
| domain | string | CDN 域名     |
| url    | string | CDN 访问链接 |
