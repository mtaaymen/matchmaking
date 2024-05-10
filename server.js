const express = require('express')
const fs = require('fs')
const app = express()
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require( 'cookie-parser' )
const config = require('./config')
const path = require('path')
const mime = require('mime-types')

const httpServer = http.createServer(app)
const reactServer = http.createServer((req, res) => {
    let filePath = path.resolve(__dirname, 'build', decodeURIComponent(req.url.slice(1)))
  
    if (filePath === path.resolve(__dirname, 'build')) {
        filePath = path.join(filePath, 'index.html')
    }
  
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                const indexFilePath = path.join(path.resolve(__dirname, 'build'), 'index.html')
                fs.readFile(indexFilePath, (err, indexData) => {
                    if (err) {
                        res.writeHead(404)
                        res.end('404 Not Found')
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexData);
                    }
                })
            } else {
                res.writeHead(500)
                res.end('500 Internal Server Error')
            }
        } else {
            const contentType = mime.contentType(path.extname(filePath)) || 'application/octet-stream';
  
            res.writeHead(200, { 'Content-Type': contentType })
            res.end(data)
        }
    })
})

const corsOptions = {
    "origin": [config.CLIENT_URL, "http://localhost:3000"],
    "methods": ['POST', 'PATCH', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
    "credentials": true,
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "exposedHeaders": ["set-cookie"]
}

app.use((req, res, next) => {
    next()
})

app.set( 'trust proxy', false )
app.use( /*express.text(),*/ express.json() )
app.use( bodyParser.urlencoded({ extended: true }) )
app.use( cookieParser() )
app.use( cors(corsOptions) )
app.use( express.static( __dirname + '/public' ) )

const apiRoute = require('./routes/api.route')

app.use( '/api', apiRoute )

httpServer.listen( config.PORT, () => {
    console.log(`Listening on port ${config.PORT}.`)
})

reactServer.listen( config.CLIENT_PORT, () => {
    console.log(`Listening on port ${config.CLIENT_PORT}.`)
})