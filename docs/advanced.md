## 高级功能

以下功能针对 Node.js 框架服务

## 静态资源服务

如果想要支持返回静态资源，比如图片之类的，需要在入口文件 `sls.js` 中指定相关 `MIME` 类型的文件为二进制，这样云函数在返回请求结果给 API 网关是，会对指定类型进行 `Base64` 编码，最终返回给客户端才能正常显示。如下：

```js
const express = require('express');
const app = express();

// Routes
// ...

app.binaryTypes = ['*/*'];

module.exports = app;
```

`['*/*']` 代表所有文件类型将进行 `Base64` 编码，如果需要定制化，可以配置为 `['image/png']`，意思是指定 `png` 格式的图片类型。

更多文件类型的 `MIME` 类型，可参考 [mime-db](https://github.com/jshttp/mime-db/blob/master/db.json)。

## slsInitialize 应用初始化

有些时候，Nodejs 框架服务在启动前，需要进行一个初始化操作，比如数据库建连，就可以通过在 Web 实例对象上添加 `slsInitialize` 函数来实现，

Express 框架入口文件示例如下：

```js
const express = require('express');
const mysql = require('mysql2/promise');

const app = new express();

// ...
app.slsInitialize = async () => {
  app.db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'test',
  });
};

module.exports = app;
```

这样应用部署到云函数后，在函数服务逻辑执行前，会先执行 `slsInitialize()` 函数，来初始化数据库连接。
