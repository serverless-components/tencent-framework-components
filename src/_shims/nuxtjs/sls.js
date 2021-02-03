const express = require('express')
const { loadNuxt } = require('nuxt')

async function createServer() {
  // not report route for custom monitor
  const noReportRoutes = ['/_nuxt', '/static', '/favicon.ico']

  const server = express()
  const nuxt = await loadNuxt('start')

  server.all('*', (req, res, next) => {
    noReportRoutes.forEach((route) => {
      if (req.path.indexOf(route) === 0) {
        req.__SLS_NO_REPORT__ = true
      }
    })
    return nuxt.render(req, res, next)
  })

  // define binary type for response
  // if includes, will return base64 encoded, very useful for images
  server.binaryTypes = ['*/*']

  return server
}

module.exports = createServer
