# 开发文档

## 目录介绍

```
./
├── LICENSE
├── README.md
├── __tests__                 # 测试目录
├── commitlint.config.js
├── docs                      # 项目文档
├── examples                  # 项目示例
├── jest.config.js
├── package.json
├── prettier.config.js
├── release.config.js
├── scripts                   # 自动化脚本
├── src                       # 组件代码
├── tsconfig.json
├── typings                   # 类型声明
└── version.yml               # 记录各组件版本号
```

核心主要关注 `src` 目录，其中为组件运行代码，`src` 目录结构如下：

```
./src
├── _fixtures             # 一些组件相关的特定代码
├── _shims                # 框架相关的垫片代码
├── config.ts             # 组件部署配置
├── formatter.ts          # 鼓励和规范化 yaml 的 inputs
├── index.ts              # 组件入口代码
├── interface             # 类型声明
├── package.json
├── serverless.ts         # 特意为 serverless component 准备的入口代码
├── serverless-core.d     # @serverless/core 的类型声明（serverless 官方没有 ts 声明）
└── utils.ts              # 工具函数
```

## 初始化

项目开发之前，需要先安装所有需要的模块依赖，包括：

1. 项目开发依赖 `/`
2. 组件代码依赖 `src/`
3. 组件垫片代码依赖，`src/_shims/<framework>`

只需要执行如下命令：

```bash
$ yarn bootstrap
```

## 组件版本号更新

当前已经发布的组件版本都维护在项目根目录的 `version.yml` 文件，我们可以通过 `yarn change:version` 命令来更新组件版本。

比如更新 `express` 组件版本号，递增方式为 `patch` ：

```bash
$ yarn change:version --framework=express --type=patch
```

如果不带 `--type` 参数，会通过交互方式让选择：

```bash
$ yarn change:version --framework=express
yarn run v1.22.10
$ ts-node ./scripts/version.ts --framework=express
ℹ No version is specified
? Please select version type ?
  patch
  minor
❯ major
```

如果想批量更新所有组件版本，带上 `-a` 参数就行：

```bash
$ yarn change:version --all --type=patch
```

如果想直接指定版本号：

```bash
$ yarn change:version --framework=express --ver=2.0.0
```

## 组件发布

更新好组件版本号后，就可以执行 `yarn deploy` 命令来发布组件了。
> 要求 Node.js 版本 `>14.14.0`。

此项目可以同时发布一下所有框架组件：

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

修改代码后，只需要执行如下命令部署：

```bash
$ yarn deploy
```

部署的组件版本将依赖项目根目录 `version.yml` 中的 `version` 字段。

也可以通过命令行指定版本：

```bash
$ yarn deploy --version=1.0.0
```

发布 `dev` 版本：

```bash
$ yarn deploy --dev
```

或者指定特定框架：

```bash
$ yarn deploy --framework=express
```

组件发布命令默认部署到 `dev` 环境，如果要发布到 `prod` 环境可以通过 `-e` 或者 `--env` 参数指定：

```bash
$ yarn deploy --framework=express --env=prod
```

> 注意：发布到 `prod` 环境参数，请慎用，发布前一定要确保充分验证过。

## 部署示例项目

项目根目录有 `examples` 目录，下面有支持组件的示例项目，每个项目中都有 `serverless.yml` 配置文件，在开发中，我们经常会将配置中的 `component` 字段使用的组件版本添加 `@dev`，每次手动改会非常麻烦，所以提供了自动化脚本自动部署。

比如使用 `dev` 环境的组件 `express` 的 `dev` 版本：

```bash
$ yarn example -f express -d
```

> 默认使用的就是 `dev` 环境

使用正式环境的 `express` 组件：

```bash
$ yarn example -e prod -f express
```

如果想部署成功后自动打开网关 URL，可以带上 `-o` 参数：

```bash
$ yarn example -e prod -o -f express
```

移除部署的项目：

```bash
$ yarn example -e prod -f express -r
```
