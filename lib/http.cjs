const path = require('path')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { mkdirp } = require('mkdirp')
const http = require('http')
const https = require('https')

function parseQueryString (req) {
  let qs
  if (req.query && Object.keys(req.query).length > 0) {
    qs = Object.keys(req.query).reduce((previous, key) => {
      previous.push(`${key}=${req.query[key]}`)
      return previous
    }, []).join('&')
  }
  return qs
}

module.exports = function (localConfig, port, staticDirs, extensions, useHttps, create) {
  // set vars
  if (localConfig && localConfig.port) port = localConfig.port
  if (localConfig && localConfig.extensions) extensions = localConfig.extensions
  if (localConfig && localConfig.staticDirs) staticDirs = localConfig.staticDirs
  if (localConfig && localConfig.useHttps) useHttps = localConfig.useHttps
  if (localConfig && localConfig.create) create = localConfig.create

  const privateKey = fs.readFileSync(path.join(__dirname, '../certs/key.pem'), 'utf8')
  const certificate = fs.readFileSync(path.join(__dirname, '../certs/cert.pem'), 'utf8')
  const credentials = { key: privateKey, cert: certificate }

  const app = express()

  // set-up proxies
  if (localConfig && localConfig.proxy) {
    for (const key in localConfig.proxy) {
      app.use(key, createProxyMiddleware(typeof localConfig.proxy[key] === 'string' ? { target: localConfig.proxy[key], changeOrigin: true } : localConfig.proxy[key]))
    }
  }

  // add cors
  app.use(cors())

  // set-up express static file serving
  const index = ['index.html', 'index.json']
  staticDirs.forEach(d => extensions ? app.use(express.static(d, { extensions: extensions.split(','), index })) : app.use(express.static(d, { index })))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  // catch-all post, put, patch and delete
  const catchAll = statusCode => (req, res) => {
    if (create &&
      (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const d = staticDirs[0]
      const qs = parseQueryString(req)
      const dir = path.join(d, req.baseUrl + req.path)
      mkdirp.sync(dir)
      let filePath = path.join(dir, `${req.method}.json`)
      if (qs) {
        filePath = path.join(dir, `${req.method}_${qs}.json`)
      }
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2))
    }

    let responseSent = false
    staticDirs.forEach(d => {
      const responseFilePath = path.join(d, req.url, `${req.method}.json`)
      if (fs.existsSync(responseFilePath)) {
        res.status(200).json(JSON.parse(fs.readFileSync(responseFilePath, { encoding: 'utf8' })))
        responseSent = true
      }
    })
    if (!responseSent) res.sendStatus(statusCode)
  }

  app.post('*', catchAll(201))
  app.put('*', catchAll(204))
  app.patch('*', catchAll(204))
  app.delete('*', catchAll(204))

  app.get('*', (req, res) => {
    const qs = parseQueryString(req)
    let responseSent = false
    staticDirs.forEach(d => {
      let responseDir = path.join(d, req.baseUrl + req.path)
      if (qs) {
        const qsFilePath = path.join(path.dirname(responseDir), `${path.basename(responseDir)}_${qs}.json`)
        const qsDir = path.join(path.dirname(responseDir), `${path.basename(responseDir)}_${qs}`)
        const qsDirIndex = path.join(path.dirname(responseDir), `${path.basename(responseDir)}_${qs}/index.json`)
        if (fs.existsSync(qsFilePath)) {
          res.status(200).json(JSON.parse(fs.readFileSync(qsFilePath, { encoding: 'utf8' })))
          responseSent = true
        } else if (fs.existsSync(qsDirIndex)) {
          res.status(200).json(JSON.parse(fs.readFileSync(qsDirIndex, { encoding: 'utf8' })))
          responseSent = true
        } else if (fs.existsSync(qsDir) && !fs.existsSync(qsDirIndex)) {
          responseDir = qsDir
        }
      }
      if (fs.existsSync(responseDir)) {
        const files = fs.readdirSync(responseDir)
        const jsonFiles = files.filter(el => path.extname(el) === '.json')
        const htmlFiles = files.filter(el => path.extname(el) === '.html')
        if (!responseSent && jsonFiles.length === 1 && /[0-9]{3}\.json/.test(jsonFiles[0])) {
          const filename = path.basename(jsonFiles[0], '.json')
          const statusCode = parseInt(filename, 10)
          const responseFilePath = path.join(d, req.baseUrl + req.path, jsonFiles[0])
          res.status(statusCode).json(JSON.parse(fs.readFileSync(responseFilePath, { encoding: 'utf8' })))
          responseSent = true
        } else if (!responseSent && htmlFiles.length === 1 && /[0-9]{3}\.html/.test(htmlFiles[0])) {
          const filename = path.basename(htmlFiles[0], '.html')
          const statusCode = parseInt(filename, 10)
          const responseFilePath = path.join(d, req.baseUrl + req.path, htmlFiles[0])
          res.status(statusCode).sendFile(responseFilePath)
          responseSent = true
        }
      }
    })
  })

  let server
  if (useHttps) {
    server = https.createServer(credentials, app)
  } else {
    server = http.createServer(app)
  }

  // start the server
  server.listen(port)
}
