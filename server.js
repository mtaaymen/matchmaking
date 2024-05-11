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
const requestIp = require('request-ip');

const httpServer = http.createServer(app)

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
app.use( express.static( path.resolve(__dirname, './build')) )
app.use(requestIp.mw())

const apiRoute = require('./routes/api.route')

app.use( '/api', apiRoute )
app.use('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './build', 'index.html'));
})

httpServer.listen( config.PORT, () => {
    console.log(`Listening on port ${config.PORT}.`)
})