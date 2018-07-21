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

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log(`Usage: node ${process.argv[1]} FILENAME`)
  console.log('Needs a file to run server.js on')
  process.exit(1);
}
// Read the file and print its contents.
var decoded = {
	from: 'test'
}
console.log(decoded.from)
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

let Section = function(id, text, contentType, transferEncoding, mediaQuery) {
	this.id = id
	this.text = text
	this.contentType = contentType
	this.transferEncoding = transferEncoding
	this.mediaQuery = mediaQuery
}

let results = {
	fileName: filename,
	sender: '',
	mainType: '',
	sections: []
}

let test = function(decoded, text) {
	execute(decoded, text)
}

{
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

	let decodeSection = function(section) {
		if (section.contentType == contentTypes.textPlain) {
			section.text = decoded.text
		} else if (section.contentType == contentTypes.textHTML) {
			section.text = decoded.html
		}
	}

	let testMulti = function(s) {

		let index1 = s.indexOf(searchPhrases.boundary)
		let index2 = s.indexOf('\n', index1)
		let boundary = s.substring(index1 + searchPhrases.boundary.length, index2)
		boundary = trimQuotes(boundary)
		console.log(`boundary identifier is: ${boundary}`)

		let leftover = s.substring(index2)
		splitSections(leftover, boundary)

		results.sections.forEach(function(section) {
			console.log(`Section ${section.id}`)
			let content = getContentType(section.text)
			decodeSection(section)
			let encoding = getTransferEncoding(section.text)
			let media = getMediaQuery(section.text)
			section.contentType = content.result
			section.transferEncoding = encoding.result
			section.mediaQuery = media.result
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
			let newSection = new Section(results.sections.length, text)
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
		console.log(`file name: ${results.fileName}`)
		console.log(`sender: ${results.sender}\ncontent type: ${results.mainType}`)
		results.sections.forEach(function(each) {
			console.log(`Section ${each.id}:`)
			message('  content type', true, each.contentType)
			message('  transfer encoding', true, each.transferEncoding)
			message('  media query', true, each.mediaQuery)
		})
	}

	var execute = function(decoded, fileText) {
		// let sender = getSender(fileText)
		// results.sender = sender.result
		console.log(decoded.from[0].name)
		results.sender = decoded.from[0].name
		let content = getContentType(fileText)
		results.mainType = content.result
		if (content.result == contentTypes.multiPart) {
			let leftover = fileText.substring(content.endIndex)
			testMulti(leftover)
		} else {
			let encoding = getTransferEncoding(fileText)
			let media = getMediaQuery(fileText)
			let newSection = new Section(results.sections.length, fileText.substring(content.startIndex), content.result, encoding.result, media.result)
			decodeSection(newSection)
			results.sections.push(newSection)
		}
		report()
		//console.log(results)
	}
}




















