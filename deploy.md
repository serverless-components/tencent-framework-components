## 发布文档

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

或者指定特定框架：

```bash
$ npm run deploy --framework=express
```
