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
$ npm run bootstrap
```

## 组件发布

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
$ npm run deploy
```

部署的组件版本将依赖项目根目录 `version.yml` 中的 `version` 字段。

也可以通过命令行指定版本：

```bash
$ npm run deploy --version=1.0.0
```

发布 `dev` 版本：

```bash
$ npm run deploy --dev
```

或者指定特定框架：

```bash
$ npm run deploy --framework=express
```

组件发布命令默认部署到 `dev` 环境，如果要发布到 `prod` 环境可以通过 `-e` 或者 `--env` 参数指定：

```bash
$ npm run deploy --framework=express --env=prod
```

> 注意：发布到 `prod` 环境参数，请慎用，发布前一定要确保充分验证过。

## 示例项目使用

项目根目录有 `examples` 目录，下面有支持组件的示例项目，每个项目中都有 `serverless.yml` 配置文件，在开发中，我们经常会将配置中的 `component` 字段使用的组件版本添加 `@dev`，每次手动改会非常麻烦，所以提供了自动化脚本来修改。

比如指定修改 `examples/express` 为 `dev` 版本：

```bash
$ npm run change:version -f expess -d
```

如果需要还原只需执行：

```bash
$ npm run change:version -f express
```
