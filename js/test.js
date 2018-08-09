
var MailParser = require("mailparser-mit").MailParser;
var mailparser = new MailParser();

let multiResults = {
	list: [],
	count: 0,
	singlePartCount: 0,
	multiPartCount: 0,
}

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log(`Usage: node ${process.argv[1]} DIRNAME`)
  console.log('Needs a directory of files to run test.js on')
  process.exit(1);
}
// Read the file and print its contents.
var fs = require('fs')

let dir = process.argv[2];
var length

fs.readdir(dir, function (err, files) {
	if (err) {throw err}
	//console.log(files)
	length = files.length
 	for (var index in files) {
 		if (multiResults.count > files.length) {break}
 		console.log('/// new file ///')
	    let filename = files[index]
	    fs.readFile(`${dir}/${filename}`, 'utf8', function(error, data) {
			if (error) {throw error}
		  	console.log(`${filename} successfully loaded`);
		  	//console.log(data)
		  	decode(data, filename)
		})
	}
})


let decode = function(email, fileName) {
	// setup an event listener when the parsing finishes
	mailparser.on("end", function(mail){
	    test(mail, email, fileName)
	    //needed to call test inside this block because test was being called before this section of parsing finished,
	    //causing crashed because passing the 'mail' object would be undefined
	});
	// send the email source to the parser
	mailparser.write(email);
	mailparser.end();
}

let test = function(decoded, text, fileName) {
	if (multiResults.count < length) {
		execute(decoded, text, fileName)
		console.log(multiResults)
		multiResults.list.forEach(function(each) {
			console.log(each.report)
		})
	}
}

{
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

	class Section {
		constructor(id, text, contentType, transferEncoding, mediaQuery) {
			this.id = id
			this.text = text
			this.contentType = contentType
			this.transferEncoding = transferEncoding
			this.mediaQuery = mediaQuery
		}
	}
	
	let results = {
		fileName: '',
		sender: '',
		mainType: '',
		sections: [],
		report: ''
	}

	let resultReset = function() {
		results = {
			fileName: '',
			sender: '',
			mainType: '',
			sections: [],
			report: ''
		}
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
			return `${s} is: ${result}`
		} else {
			return `${s} not found.`
		}
	}

	let getQuery = function(s, phrase, endPhrase, searchWord) {
		let query = parser(s, phrase, endPhrase)
		console.log(message(searchWord, query.success, query.result))
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
		var report = ''

		console.clear()

		report = report.concat('// REPORT //\n')
		report = report.concat(`file name: ${results.fileName}\nsender: ${results.sender}\ncontent type: ${results.mainType}\n`)
		results.sections.forEach(function(each) {
			report = report.concat(`Section ${each.id}:`, '\n')
			report = report.concat(message('  content type', true, each.contentType),'\n')
			report = report.concat(message('  transfer encoding', true, each.transferEncoding),'\n')
			report = report.concat(message('  media query', true, each.mediaQuery),'\n')
		})
		return report
	}

	let decoded

	var execute = function(parsed, fileText, fileName) {
		decoded = parsed
		results.fileName = fileName
		let sender = getSender(fileText)
		results.sender = sender.result
		console.log(decoded.from[0].name)
		//results.sender = decoded.from[0].name
		let content = getContentType(fileText)
		results.mainType = content.result
		if (content.result == contentTypes.multiPart) {
			let leftover = fileText.substring(content.endIndex)
			testMulti(leftover)
			multiResults.multiPartCount += 1

		} else {
			let encoding = getTransferEncoding(fileText)
			let media = getMediaQuery(fileText)
			let newSection = new Section(results.sections.length, fileText.substring(content.startIndex), content.result, encoding.result, media.result)
			decodeSection(newSection)
			results.sections.push(newSection)
			multiResults.singlePartCount += 1
		}
		results.report = report()
		multiResults.list.push(results)
		multiResults.count += 1
		resultReset()
		//console.log(results)
	}
}
 
