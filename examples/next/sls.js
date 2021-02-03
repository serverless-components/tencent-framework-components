const express = require('express')
const next = require('next')

async function createServer() {
  const app = next({ dev: false })
  const handle = app.getRequestHandler()

  // not report route for custom monitor
  const noReportRoutes = ['/_next', '/favicon.ico']

  await app.prepare()
  const server = express()

  server.all('*', (req, res) => {
    noReportRoutes.forEach((route) => {
      if (req.path.indexOf(route) === 0) {
        req.__SLS_NO_REPORT__ = true
      }
    })
    return handle(req, res)
  })

  // define binary type for response
  // if includes, will return base64 encoded, very useful for images
  server.binaryTypes = ['*/*']

  return server
}

module.exports = createServer
