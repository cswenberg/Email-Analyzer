

let fileText

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
	sender: '',
	mainType: '',
	sections: []
}

window.onload = function () { 
	//Check the support for the File API support 
 	if (window.File && window.FileReader && window.FileList && window.Blob) {
    	let fileSelected = document.getElementById('txtfiletoread');
    	fileSelected.addEventListener('change', function (e) { 
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
		            console.log(fileText)
		            results.sender = ''
		            results.mainType = ''
		            results.sections = []
		            test(fileText)
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

let test = function(text) {
	execute(text)
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

	let getQuery = function(s, phrase, endPhrase, message) {
		let query = parser(s, phrase, endPhrase)
		if (query.success) {
			console.log(`${message} is: ${query.result}`)
		} else {
			console.log(`${message} not found.`)
		}
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

	var execute = function(fileText) {
		let sender = getSender(fileText)
		results.sender = sender.result
		let content = getContentType(fileText)
		results.mainType = content.result
		if (content.result == contentTypes.multiPart) {
			let leftover = fileText.substring(content.endIndex)
			testMulti(leftover)
		} else {
			let encoding = getTransferEncoding(fileText)
			let media = getMediaQuery(fileText)
			let newSection = new Section(results.sections.length, fileText.substring(content.startIndex), content.result, encoding.result, media.result)
			results.sections.push(newSection)
		}
		console.log(results)
	}
}




















