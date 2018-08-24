

console.log('in script.js')

let MailParser = require('mailparser-mit').MailParser
let mailparser = new MailParser()
let Parser = require('./parser.js')
let Controller = require('../index.js')
let fs = require('fs')

let usingCommandLine = false
let results

let DOM = {
  sender: document.querySelector('.sender-result'),
  email: document.querySelector('.email-result'),
  content_type: document.querySelector('.content_type-result'),
  textHead: document.querySelector('.text_part'),
  htmlHead: document.querySelector('.html_part'),
  textEncoding: document.querySelector('.text-encoding'),
  htmlEncoding: document.querySelector('.html-encoding'),
  textLines: document.querySelector('.text-lines'),
  htmlMedia: document.querySelector('.html-media')
}

let start = (fileName) => {
  fs.readFile(fileName, 'utf8', (error, data) => {
    if (error) throw error;
    console.log(`${fileName} successfully loaded`);
    decode(data, fileName)
  });
  console.log('start done')
}

let decode = (email, fileName = 'no file name found') => {
    // setup an event listener when the parsing finishes
    mailparser.on("end", decoded => {
      Parser.execute(fileName, email, decoded)
      results = Parser.getResults()
      console.log('results saved')
      report(results)
      Controller.renderResults(results)
      console.log('renderResults called')
      //needed to call test inside this block because test was being called before this section of parsing finished,
      //causing crashed because passing the 'mail' object would be undefined
    });
    // send the email source to the parser
    mailparser.write(email);
    mailparser.end();
    console.log('decode done')
}

const report = (results) => {
  DOM.sender.innerHTML = results.sender
  DOM.email.innerHTML = results.senderEmail
  DOM.content_type.innerHTML = results.mainType
  if (results.textPlain) {
    DOM.textHead.innerHTML = 'Text part: Yes'
    DOM.textEncoding.innerHTML = `transfer encoding: ${results.textPlain.transferEncoding}`
    DOM.textLines.innerHTML = `number of lines: none yet (in development)`
  } else {
    DOM.textHead.innerHTML = 'Text part: No'
  }
  if (results.textHTML) {
    DOM.htmlHead.innerHTML = 'HTML part: Yes'
    DOM.htmlEncoding.innerHTML = `transfer encoding: ${results.textHTML.transferEncoding}`
    DOM.htmlMedia.innerHTML = `media queries: ${results.textHTML.mediaQuery}`
  } else {
    DOM.htmlHead.innerHTML ='HTML part: No'
  }
}

const resetUI = () => {
  console.log(DOM)
  console.log('reset ui executing')
  DOM.sender.innerHTML = ""
  DOM.email.innerHTML = ""
  DOM.content_type.innerHTML = ""
  DOM.textHead.innerHTML = "Text part: "
  console.log(DOM.textHead.innerHTML)
  DOM.htmlHead.innerHTML ="HTML part: "
  console.log(DOM.htmlHead.innerHTML)
  DOM.textEncoding.innerHTML = ""
  DOM.textLines.innerHTML = ""
  DOM.htmlEncoding.innerHTML = ""
  DOM.htmlMedia.innerHTML = ""
  console.log(DOM)
}

if (!usingCommandLine) {
  //alert('Webpage is not functional yet!!')
  // ABILITY TO PROMPT WINDOW TO SELECT FILE TO ANALYZE
  window.onload = () => {
    //Check the support for the File API support
    console.log('window.onload called')
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      let fileSelected = document.getElementById('txtfiletoread');
      fileSelected.addEventListener('change', (e) => {
        //Set the extension for the file
        let fileExtension = /text.*/;
        //Get the file object
        let fileTobeRead = fileSelected.files[0]
        //Check of the extension match
        if (fileTobeRead.type.match(fileExtension)) {
          //Initialize the FileReader object to read the file
          let reader = new FileReader();
          reader.onload = function (e) {
            fileText = reader.result
            //resetUI()
            window.myFile = fileText
            decode(fileText)
          }
          reader.readAsText(fileTobeRead);
        }
        else {
          alert("Please select text file");
        }
      }, false);
    } else {
      alert("Files are not supported");
    }
  }
} else if (usingCommandLine) {
  // Make sure we got a filename on the command line.
  if (process.argv.length < 3) {
    console.log(`Usage: node ${process.argv[1]} FILENAME`)
    console.log('Needs a file to run script.js on\nsuggested format is "node js/script.js testfiles/#somefile"')
    process.exit(1);
  }
  // Read the file and print its contents.
  let filename = process.argv[2];
  console.log('script',filename)
  start(filename)
}

module.exports = {
  decode
}
