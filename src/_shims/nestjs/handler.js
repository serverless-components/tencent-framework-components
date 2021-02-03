const path = require('path')
const { createServer, proxy } = require('tencent-serverless-http')
const userSls = path.join(__dirname, '..', 'sls.js')
const getApp = require(userSls)

let server

exports.handler = async (event, context) => {
  const nestApp = await getApp()
  await nestApp.init()
  const app = nestApp.getHttpAdapter().getInstance()

  // attach event and context to request
  try {
    app.request.__SLS_EVENT__ = event
    app.request.__SLS_CONTEXT__ = context
  } catch (e) {
    // no op
  }

  // provide sls intialize hooks
  if (app.slsInitialize && typeof app.slsInitialize === 'function') {
    await app.slsInitialize()
  }

  // cache server, not create repeatly
  if (!server) {
    server = createServer(app, null, app.binaryTypes || [])
  }

  context.callbackWaitsForEmptyEventLoop = app.callbackWaitsForEmptyEventLoop === true

  const { promise } = await proxy(server, event, context, 'PROMISE')
  return promise
}
