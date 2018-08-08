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

var MailParser = require("mailparser-mit").MailParser;
var mailparser = new MailParser();
var Models = require('./models.js')
var Parser = require('./parser.js')

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log(`Usage: node ${process.argv[1]} FILENAME`)
  console.log('Needs a file to run server.js on')
  process.exit(1);
}
// Read the file and print its contents.
var fs = require('fs')
let filename = process.argv[2];
fs.readFile(filename, 'utf8', function(error, data) {
  if (error) throw error;
  console.log(`${filename} successfully loaded`);
  //console.log(data)
  decode(data)
});

let decode = function(email) {
	// setup an event listener when the parsing finishes
	mailparser.on("end", function(mail){
		//console.log("\n\n\n\nText body:", mail.text); // How are you today?
		//console.log('\n\n\n\nHTML body:', mail.html)
	    console.log("From:", mail.from); //[{address:'sender@example.com',name:'Sender Name'}]
	    console.log("Subject:", mail.subject); // Hello world!
	    console.log('Attachments:', mail.attachments)
	    console.log('test finished')
	    console.log('mail', mail)
	    test(mail, email)
	    //needed to call test inside this block because test was being called before this section of parsing finished,
	    //causing crashed because passing the 'mail' object would be undefined
	});

	// send the email source to the parser
	mailparser.write(email);
	mailparser.end();
}

let test = function(decoded, text) {
	execute(decoded, text)
}

{
  let decoded
	let searchPhrases = Parser.searchPhrases
	let contentTypes = Parser.contentTypes
	let results = {
		fileName: filename,
		sender: '',
		mainType: '',
		sections: []
	}

  var execute = function(dcded, fileText) {
    // let sender = getSender(fileText)
    // results.sender = sender.result
    decoded = dcded
    console.log(decoded.from[0].name)
    results.sender = decoded.from[0].name
    let content = Parser.getContentType(fileText)
    results.mainType = content.result
    if (content.result == contentTypes.multiPart) {
      let leftover = fileText.substring(content.endIndex)
      testMulti(leftover)
    } else {
      testSingle(fileText, results.mainType)
    }
    report()
    //console.log(results)
  }

  let testSingle = (fileText, type) => {
    let encoding = Parser.getTransferEncoding(fileText)
    if (type == contentTypes.textPlain) {
      //console.log('found plain text part')
      let newPlainText = new Models.PlainText(results.sections.length, decoded.text, encoding.result)
      results.textPlain = newPlainText
    } else if (type == contentTypes.textHTML) {
      //console.log('found text html part')
      let media = Parser.getMediaQuery(fileText)
      let newTextHTML = new Models.TextHTML(results.sections.length, decoded.html, encoding.result, media.result)
      results.textHTML = newTextHTML
    }
    //console.log(type)
  }

	let testMulti = s => {
		let index1 = s.indexOf(searchPhrases.boundary)
		let index2 = s.indexOf('\n', index1)
		let boundary = s.substring(index1 + searchPhrases.boundary.length, index2)
		boundary = trimQuotes(boundary)
		//console.log(`boundary identifier is: ${boundary}`)

		let leftover = s.substring(index2)
		splitSections(leftover, boundary)

		results.sections.forEach(function(section) {
			let content = Parser.getContentType(section.text)
      testSingle(section.text, content.result)
		})
	}

	let splitSections = function(s, boundary) {
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
			let newSection = new Models.Section(results.sections.length, text)
			results.sections.push(newSection)
		}
		//console.log(results.sections)
	}

	let findNextBoundary = function(s, boundary) {
		console.log(s)
		let boundIndex = s.indexOf(boundary)
		if (boundIndex != -1) {
			console.log(`next boundary found at: ${boundIndex}`)
			//console.log(s.substring(boundIndex))
			return {
				success: true,
				text: s.substring(boundIndex),
				index: boundIndex
			}
		} else {
			console.log('next boundary not found.')
			return {
				success: false
			}
		}
	}

  /** Used by testMulti to trim quotations from boundary identifier */
	let trimQuotes = function(s) {
		//console.log(s)
		let index1 = s.indexOf('"')
		let string = s.substring(index1+1)
		//console.log(string)
		let index2 = string.indexOf('"')
		string = string.substring(0, index2)
		//console.log(string)
		return string
	}


  let report = function() {
    console.clear()
    console.log('// REPORT //')
    console.log(`File Name: ${results.fileName}`)
    console.log(`Sender Name: ${results.sender}\nContent-type: ${results.mainType}`)
    if (results.textPlain) {
      console.log(`Text Part: Yes`)
      //Parser.message('  content type', true, results.textPlain.contentType)
      Parser.message('  transfer encoding', true, results.textPlain.transferEncoding)
      //number of lines
    } else {
      console.log('Text Part: No')
    }
    if (results.textHTML) {
      console.log('HTML Part: Yes')
      //Parser.message('  content type', true, results.textHTML.contentType)
      Parser.message('  transfer encoding', true, results.textHTML.transferEncoding)
      Parser.message('  media query', true, results.textHTML.mediaQuery)
    } else {
      console.log('HTML Part: No')
    }
  }
}
