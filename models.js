
class Section {
  constructor(id, text, contentType, transferEncoding, mediaQuery) {
    this.id = id
    this.text = text
    this.contentType = contentType
    this.transferEncoding = transferEncoding
    this.mediaQuery = mediaQuery
  }
}

class PlainText {
  constructor(id, text, transferEncoding) {
    this.id = id
    this.text = text
    this.transferEncoding = transferEncoding
  }
  numberLines() { return this.text.count('\n') }
}
class TextHTML {
  constructor(id, text, transferEncoding, mediaQuery) {
    this.id = id
    this.text = text
    this.transferEncoding = transferEncoding
    this.mediaQuery = mediaQuery
  }
}


module.exports = {
  PlainText,
  TextHTML,
  Section
}
