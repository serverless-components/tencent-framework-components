## 文件上传说明

项目中如果涉及到文件上传，需要依赖 API 网关提供的 [Base64 编码能力](https://cloud.tencent.com/document/product/628/51799)，使用时只需要 `serverless.yml` 中配置 `isBase64Encoded` 为 `true`，如下：

```yaml
app: appDemo
stage: dev
component: koa
name: koaDemo

inputs:
  # 省略...
  apigatewayConf:
    isBase64Encoded: true
    # 省略...
  # 省略...
```

当前 API 网关支持上传最大文件大小为 `2M`，如果文件过大，请修改为前端直传对象存储方案。

## Base64 示例

入口文件 `sls.js` 如下:

```js
const Koa = require('koa');
const KoaRouter = require('@koa/router');
const multer = require('@koa/multer');

const isServerless = process.env.SERVERLESS;
const app = new Koa();
const router = new KoaRouter();
const upload = multer({ dest: isServerless ? '/tmp/upload' : './upload' });

router.post('/upload', upload.single('file'), (ctx) => {
  ctx.body = {
    success: true,
    data: ctx.file,
  };
});

app.use(router.routes()).use(router.allowedMethods());

if (isServerless) {
  module.exports = app;
} else {
  app.listen(3000, () => {
    console.log(`Server start on http://localhost:3000`);
  });
}
```

示例代码实现了文件上传接口 `POST /upload`，如果要支持文件上传，需要安装 `@koajs/multer` 和 `multer` 包。

同时需要在 `serverless.yml` 的 `apigatewayConf` 中配置 `isBase64Encoded` 为 `true`。
