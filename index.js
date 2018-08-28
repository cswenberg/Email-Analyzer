

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const fs = require('fs')
const Parser = require('./js/parser.js')
const handles = require('handlebars')

const app = express()
const port = 8888

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
//
// let renderTest = (res, results) => {
//   console.log('rendering results')
//   res.render('index', {
//       sender: 'anal',
//       senderEmail: 'anal',
//       mainType: 'anal',
//       textPlain: 'anal',
//       plainEncoding: 'anal',
//       textHTML: 'anal',
//       htmlEncoding: 'anal',
//       htmlMedia: 'anal'
//   })
// }

// let renderResults = (res,results) => {
//   console.log('rendering results')
//   res.render('index', {
//     sender: results.sender,
//     senderEmail: results.senderEmail,
//     mainType: results.mainType,
//     textPlain: results.textPlain,
//     plainEncoding: results.textPlain.transferEncoding,
//     textHTML: results.textHTML,
//     htmlEncoding: results.textHTML.transferEncoding,
//     htmlMedia: results.textHTML.mediaQuery
//   })
// }
//
// module.exports = {
//   renderResults
// }

//console.log(module.exports)

app.get('/', (req, res) => {
  res.render('index')
  // document.querySelector('.submit').addEventListener('click', () => {
  //   console.log('submit button pressed')
  // })
})

app.post('/', (req, res) => {
  console.log('posted')
  //console.log(`file name: ${req.body.file}`)
  const fileName = req.body.file
  fs.readFile(`./testfiles/${fileName}`, 'utf8', (error, data) => {
    if (error) throw error;
    //console.log(`${fileName} successfully loaded`);
    //console.log(data)
    Parser.decode(res, data, fileName)
    //renderTest(res, {})
  });
  console.log('file is read')
  req.body.sender = 'testing'
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
