require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http')
const cookieParser = require('cookie-parser')
const server = http.createServer(app)
const corsMiddleware = require('./middlewares/cors')
const exceptionHandler = require('./middlewares/exceptionHandler')
const apiRoutes = require('./routes/api')
const MongooseConnection = require("./mongooseConnection")
const ioConnection = require('./socketConnection')
const fileUpload = require('express-fileupload')





app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/'
}))
app.use(express.static('./public/'))
app.use(corsMiddleware)
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

sioConnection = ioConnection(server)

app.set('socket', sioConnection)
app.use('/api', apiRoutes)

app.use(exceptionHandler)



const dbConnection = new MongooseConnection()

dbConnection.connect(() => {
  server.listen(3000, () => {
    console.log('listening')
  })
})
