
var MailParser = require("mailparser-mit").MailParser;
var mailparser = new MailParser();

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

let parser = function(s, phrase, endPhrase) {
  let index1 = s.indexOf(phrase)
  if (index1 != -1) {
    let index2 = s.indexOf(endPhrase, index1)
    let string  = s.substring(index1 + phrase.length, index2)
    return {
      success: true,
      result: string,
      startIndex: index1,
      endIndex: index2
    }
  } else {
    return {
      success: false,
      result: 'none'
    }
  }
}

let message = function(s, bool, result) {
  if (bool) {
    console.log(`${s} is: ${result}`)
  } else {
    console.log(`${s} not found.`)
  }
}

let getQuery = function(s, phrase, endPhrase, searchWord) {
  let query = parser(s, phrase, endPhrase)
  message(searchWord, query.success, query.result)
  return query
}

let getSender = function(s) {
  let index1 = s.indexOf(searchPhrases.arcAuth)
  if (index1 != -1) {
    let query = getQuery(s, searchPhrases.sender, '\n', 'sender')
    return query
  } else {
    console.log(`${searchPhrases.arcAuth} not found.`)
  }
  return {
    success: false,
    result: 'none'
  }
}

let getContentType = function(s) {
  let query = getQuery(s, searchPhrases.contentType, ';', 'content type')
  return query
}

let getTransferEncoding = function(s) {
  let query = getQuery(s, searchPhrases.transferEncoding, '\n', 'transfer encoding')
  return query
}

let getMediaQuery = function(s) {
  let query = getQuery(s, searchPhrases.mediaQuery, '\n', 'media query')
  return query
}

module.exports = {
  message,
  getQuery,
  getSender,
  getContentType,
  getTransferEncoding,
  getMediaQuery,
  searchPhrases,
  contentTypes
}
