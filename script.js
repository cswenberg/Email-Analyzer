// ABILITY TO PROMPT WINDOW TO SELECT FILE TO ANALYZE

// window.onload = function () {
// 	//Check the support for the File API support
//  	if (window.File && window.FileReader && window.FileList && window.Blob) {
//     	let fileSelected = document.getElementById('txtfiletoread');
//     	fileSelected.addEventListener('change', function (e) {
// 	        //Set the extension for the file
// 	        let fileExtension = /text.*/;
// 	        //Get the file object
// 		    let fileTobeRead = fileSelected.files[0]
// 		    //Check of the extension match
// 		    if (fileTobeRead.type.match(fileExtension)) {
// 		        //Initialize the FileReader object to read the 2file
// 		        let reader = new FileReader();
// 		        reader.onload = function (e) {
// 		            fileText = reader.result
// 		            console.log(fileText)
// 		            results.sender = ''
// 		            results.mainType = ''
// 		            results.sections = []
// 		            test(fileText)
// 		        }
// 		        reader.readAsText(fileTobeRead);
// 		    }
// 		    else {
// 		        alert("Please select text file");
// 		    }
// 	    }, false);
// 	} else {
//      alert("Files are not supported");
//  	}
// }
var fs = require('fs')
var MailParser = require("mailparser-mit").MailParser;
var mailparser = new MailParser();
let Parser = require('./parser.js')

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log(`Usage: node ${process.argv[1]} FILENAME`)
  console.log('Needs a file to run script.js on')
  process.exit(1);
}
// Read the file and print its contents.
let filename = process.argv[2];
console.log('script',filename)

let results

let start = (fileName) => {
  fs.readFile(fileName, 'utf8', (error, data) => {
    if (error) throw error;
    console.log(`${fileName} successfully loaded`);
    decode(data, fileName)
  });
  console.log('start done')
}

let decode = (email, fileName) => {
	// setup an event listener when the parsing finishes
	mailparser.on("end", decoded => {
	    console.log("From:", decoded.from);
	    console.log("Subject:", decoded.subject);
	    console.log('Attachments:', decoded.attachments)
	    console.log('test finished')
	    //console.log('mail', mail)
	    Parser.execute(fileName, email, decoded)
      results = Parser.getResults()
      console.log('results saved')
      report(results)
      //console.log(results)
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

start(filename)
