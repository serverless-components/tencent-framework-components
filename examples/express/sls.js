const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()

// Routes
app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// 获取 event
app.get(`/event`, (req, res) => {
  const event = req.__SLS_EVENT__
  res.send(event)
})

app.get(`/logo`, (req, res) => {
  const logo = path.join(__dirname, 'logo.png')
  const content = fs.readFileSync(logo, {
    encoding: 'base64'
  });
  res.set('Content-Type', 'image/png')
  res.send(Buffer.from(content, 'base64'))
  res.status(200).end();
})

app.get('/user', (req, res) => {
  res.send([
    {
      title: 'serverless framework',
      link: 'https://serverless.com'
    }
  ])
})

app.get('/user/:id', (req, res) => {
  const id = req.params.id
  res.send({
    id: id,
    title: 'serverless framework',
    link: 'https://serverless.com'
  })
})

app.get('/404', (req, res) => {
  res.status(404).send('Not found')
})

app.get('/500', (req, res) => {
  res.status(500).send('Server Error')
})

// Error handler
app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

// 指定特定的 mime 类型返回，会经过 Base64 编码，以便通过 API 网关正常返回给客户端
app.binaryTypes = ['image/png']

if (process.env.SERVERLESS) {
  module.exports = app
} else {
  app.listen(3000, () => {
    console.log(`Server start on http://localhost:3000`);
  })
}

