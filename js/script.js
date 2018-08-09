
let MailParser = require('mailparser-mit').MailParser
let mailparser = new MailParser()
let Parser = require('./parser.js')

let usingCommandLine = true
let results

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
      //needed to call test inside this block because test was being called before this section of parsing finished,
      //causing crashed because passing the 'mail' object would be undefined
    });
    // send the email source to the parser
    mailparser.write(email);
    mailparser.end();
    console.log('decode done')
}

const report = (results) => {
  Parser.report()
}

if (!usingCommandLine) {
  // ABILITY TO PROMPT WINDOW TO SELECT FILE TO ANALYZE
  window.onload = () => {
    //Check the support for the File API support
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      let fileSelected = document.getElementById('txtfiletoread');
      fileSelected.addEventListener('change', (e) => {
        //Set the extension for the file
        let fileExtension = /text.*/;
        //Get the file object
        let fileTobeRead = fileSelected.files[0]
        //Check of the extension match
        if (fileTobeRead.type.match(fileExtension)) {
          //Initialize the FileReader object to read the 2file
          let reader = new FileReader();
          reader.onload = function (e) {
            fileText = reader.result
            Decoder.decode(fileText)
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
  // grabs file from arguments in command line
  var fs = require('fs')
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
