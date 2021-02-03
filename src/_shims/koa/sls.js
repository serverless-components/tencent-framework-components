const Koa = require('koa')

const app = new Koa()

app.use(async (ctx, next) => {
  if (ctx.path !== '/') {
    return next()
  }
  ctx.body = {
    msg: `Serverless Express Application, Request received: ${ctx.req.method} - ${ctx.req.path}`
  }
})

// don't forget to export!
module.exports = app
