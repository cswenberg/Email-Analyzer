
// let LineCounter = require('line-counter')
// let counter = new LineCounter(fileText)

var Models = require('./models.js')
let MailParser = require('mailparser-mit').MailParser

let renderResults = (res,results) => {
  let render = {
    sender: results.sender,
    senderEmail: results.senderEmail,
    mainType: results.mainType
  }
  if(results.textPlain) {
      render.textPart = 'Yes'
      render.textEncoding = `transfer encoding: ${results.textPlain.transferEncoding}`
      render.textLines = 'line count: not developed yet'
  } else {
    render.textPart = 'No'
  }
  if(results.textHTML) {
    render.htmlPart = 'Yes'
    render.htmlEncoding = `transfer encoding: ${results.textHTML.transferEncoding}`
    render.mediaQuery = `media queries: ${results.textHTML.mediaQuery}`
  } else {
    render.htmlPart = 'No'
  }
  res.render('index', render)
}

let decode = (res, email, fileName = 'no file name found') => {
    let mailparser = new MailParser()
    // setup an event listener when the parsing finishes
    mailparser.on("end", (decoded) => {
      execute(fileName, email, decoded)
      results = getResults()
      //report(results)
      renderResults(res, results)
      //needed to call test inside this block because test was being called before this section of parsing finished,
      //causing crashed because passing the 'mail' object would be undefined
    });
    // send the email source to the parser
    mailparser.write(email);
    mailparser.end();
}

let reset = () => {
  results = {}
  sections = []
}

let execute = (fileName, fileText, decodedText) => {   // let sender = getSender(fileText)
  reset()
  results.fileName = fileName
  decoded = decodedText
  results.sender = decoded.from[0].name
  results.senderEmail = decoded.from[0].address
  let content = getContentType(fileText)
  results.mainType = content.result
  if (content.result == contentTypes.multiPart) {
    let leftover = fileText.substring(content.endIndex)
    testMulti(leftover)
  } else {
    testSingle(fileText, results.mainType)
  }
}

let report = (results) => {
    console.log(results)
    console.log('// REPORT //')
    console.log(`File Name: ${results.fileName}`)
    console.log(`Sender Name: ${results.sender}\nSender email: ${results.senderEmail}\nContent-type: ${results.mainType}`)
    if (results.textPlain) {
      console.log(`Text Part: Yes`)
      //message('  content type', true, results.textPlain.contentType)
      message('  transfer encoding', true, results.textPlain.transferEncoding)
      //number of lines
    } else {
      console.log('Text Part: No')
    }
    if (results.textHTML) {
      console.log('HTML Part: Yes')
      //message('  content type', true, results.textHTML.contentType)
      message('  transfer encoding', true, results.textHTML.transferEncoding)
      message('  media query', true, results.textHTML.mediaQuery)
    } else {
      console.log('HTML Part: No')
    }
  }

let getResults = () => {
  return results
}

let decoded

let searchPhrases = {
  contentType: 'Content-Type: ',
  transferEncoding: 'Content-Transfer-Encoding: ',
  multiPart: 'multipart/alternative',
  boundary: 'boundary=',
  sender: 'header.from=',
  mediaQuery: '@media ',
  arcAuth: 'ARC-Authentication-Results'
}

let contentTypes = {
  multiPart: 'multipart/alternative',
  textPlain: 'text/plain',
  textHTML: 'text/html'
}

// PARSING METHODS
let testSingle = (fileText, type) => {
  let encoding = getTransferEncoding(fileText)
  if (type == contentTypes.textPlain) {
    let newPlainText = new Models.PlainText(sections.length, decoded.text, encoding.result)
    results.textPlain = newPlainText
  } else if (type == contentTypes.textHTML) {
    let media = getMediaQuery(fileText)
    let newTextHTML = new Models.TextHTML(sections.length, decoded.html, encoding.result, media.result)
    results.textHTML = newTextHTML
  }
}

let testMulti = s => {
  let index1 = s.indexOf(searchPhrases.boundary)
  let index2 = s.indexOf('\n', index1)
  let boundary = s.substring(index1 + searchPhrases.boundary.length, index2)
  boundary = trimQuotes(boundary)
  let leftover = s.substring(index2)
  splitSections(leftover, boundary)
  sections.forEach(section => {
    let content = getContentType(section.text)
    testSingle(section.text, content.result)
  })
}

let splitSections = (s, boundary) => {
  //getting indexes of all boundaries
  let placeHolder = 0
  let indexList = []
  let okay = true
  while (okay) {
    let nextBoundary = findNextBoundary(s.substring(placeHolder), boundary)
    if (nextBoundary.success && !indexList.includes(nextBoundary.index)) {
      placeHolder += nextBoundary.index + boundary.length
      indexList.push(placeHolder)
    } else {
      okay = false
      break
    }
  }
  //put according text into each section
  for (let i = 0; i<indexList.length-1; i++) {
    let text = s.substring(indexList[i], indexList[i+1])
    let newSection = new Models.Section(sections.length, text)
    sections.push(newSection)
  }
}

let findNextBoundary = (s, boundary) => {
  let boundIndex = s.indexOf(boundary)
  if (boundIndex == -1) {
    return {
      success: false
    }
  }
  return {
    success: true,
    text: s.substring(boundIndex),
    index: boundIndex
  }
}

// Used by testMulti to trim quotations from boundary identifier
let trimQuotes = s => {
  let index1 = s.indexOf('"')
  let string = s.substring(index1+1)
  let index2 = string.indexOf('"')
  string = string.substring(0, index2)
  return string
}

let parser = (s, phrase, endPhrase, wantLineNumber) => {
  let index1 = s.indexOf(phrase)
  if (index1 == -1) {
    return {
      success: false,
      result: 'none'
    }
  }
  let index2 = s.indexOf(endPhrase, index1)
  let string  = s.substring(index1 + phrase.length, index2)
  let query = {
    success: true,
    result: string,
    startIndex: index1,
    endIndex: index2
  }
  if (wantLineNumber) {
    // console.log(text)
    // const indexToHere = text.indexOf(s)
    // const thisIndex = text.indexOf(phrase, 0)
    // query.lineNumber = counter.countUpTo(thisIndex)
    // console.log(query.lineNumber)
  }
  return query
}

let message = (s, bool, result) => {
  if (bool) {
    console.log(`${s} is: ${result}`)
  } else {
    console.log(`${s} not found.`)
  }
}

let getQuery = (s, phrase, endPhrase, searchWord, wantLineNumber = false) => {
  let query = parser(s, phrase, endPhrase, wantLineNumber)
  return query
}

let getSender = s => {
  let index1 = s.indexOf(searchPhrases.arcAuth)
  if (index1 != -1) {
    let query = getQuery(s, searchPhrases.sender, '\n', 'sender')
    return query
  }
  return {
    success: false,
    result: 'none'
  }
}

let getContentType = s => {
  let query = getQuery(s, searchPhrases.contentType, ';', 'content type')
  return query
}

let getTransferEncoding = s => {
  let query = getQuery(s, searchPhrases.transferEncoding, '\n', 'transfer encoding')
  return query
}

let getMediaQuery = s => {
  let query = getQuery(s, searchPhrases.mediaQuery, '\n', 'media query', true)
  if (!query.success) {
    let query2 = getQuery(s, '40media ', '\n', 'media query', true)
    if (query2.success) return query2
  }
  return query
}

module.exports = {
  decode
}
