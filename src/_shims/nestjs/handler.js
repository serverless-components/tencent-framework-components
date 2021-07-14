const path = require('path')
const { createServer, proxy } = require('tencent-serverless-http')
const userSls = path.join(__dirname, '..', 'sls.js')
const getApp = require(userSls)

let app
let server

exports.handler = async (event, context) => {
  // cache nestjs application
  if (!app) {
    const nestApp = await getApp()
    await nestApp.init()
    app = nestApp.getHttpAdapter().getInstance()

    // provide sls intialize hooks
    if (app.slsInitialize && typeof app.slsInitialize === 'function') {
      await app.slsInitialize()
    }
  }

  // attach event and context to request
  try {
    app.request.__SLS_EVENT__ = event
    app.request.__SLS_CONTEXT__ = context
  } catch (e) {
    // no op
  }

  // do not cache server, so we can pass latest event to server
  server = createServer(
    app.callback && typeof app.callback === 'function' ? app.callback() : app,
    null,
    app.binaryTypes || []
  )

  context.callbackWaitsForEmptyEventLoop = app.callbackWaitsForEmptyEventLoop === true

  const { promise } = await proxy(server, event, context, 'PROMISE')
  return promise
}
