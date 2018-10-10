const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const Parser = require('./js/parser.js')
const expressHandles = require('express-handlebars')

const app = express()
const port = 8888

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.engine('handlebars', expressHandles())
app.set('view engine', 'handlebars')

app.get('/', (req, res) => {res.render('index')})

app.post('/', (req, res) => {
  const fileName = req.body.file
  fs.readFile(`./testfiles/${fileName}`, 'utf8', (error, data) => {
    if (error) throw error;
    Parser.decode(res, data, fileName)
  });})

app.listen(port, (err) => {
  if (err) {console.log('something bad happened', err)}
  console.log(`server is listening on ${port}`)
})
