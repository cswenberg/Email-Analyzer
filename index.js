

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const fs = require('fs')
const Parser = require('./js/parser.js')

const app = express()
const port = 8888

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('index')
  // document.querySelector('.submit').addEventListener('click', () => {
  //   console.log('submit button pressed')
  // })
})

app.post('/', function (req, res) {
  console.log('posted')
  console.log(`file name: ${req.body.file}`)
  const fileName = req.body.file
  fs.readFile(`./testfiles/${fileName}`, 'utf8', (error, data) => {
    if (error) throw error;
    console.log(`${fileName} successfully loaded`);
    //console.log(data)
    Parser.decode(data, fileName)
  });
  console.log('file is read')
  res.render('index')
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})

let renderResults = results => {
  console.log('rendering results')
}

module.exports = {
  renderResults
}

console.log(module.exports)
