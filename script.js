

var textContents

var searchPhrases = {
	contentType: 'Content-Type: ',
	transferEncoding: 'Content-Transfer-Encoding: ',
	multiPart: 'multipart/alternative',
	boundary: 'boundary=',
	sender: 'header.from=',
	mediaQuery: '@media ',
	arcAuth: 'ARC-Authentication-Results'
}

var contentTypes = {
	multiPart: 'multipart/alternative',
	textPlain: 'text/plain',
	textHTML: 'text/html'
}

var Section = function(id, text, contentType, transferEncoding, mediaQuery) {
	this.id = id
	this.text = text
	this.contentType = contentType
	this.transferEncoding = transferEncoding
	this.mediaQuery = mediaQuery
}

var results = {
	sender: '',
	mainType: '',
	sections: []
}

window.onload = function () { 
	//Check the support for the File API support 
 	if (window.File && window.FileReader && window.FileList && window.Blob) {
    	var fileSelected = document.getElementById('txtfiletoread');
    	fileSelected.addEventListener('change', function (e) { 
	        //Set the extension for the file 
	        var fileExtension = /text.*/; 
	        //Get the file object 
	        var fileTobeRead = fileSelected.files[0];
	        //Check of the extension match 
	        if (fileTobeRead.type.match(fileExtension)) { 
	            //Initialize the FileReader object to read the 2file 
	            var reader = new FileReader(); 
	            reader.onload = function (e) { 
	                textContents = reader.result
	                console.log(textContents)
	                results.sender = ''
	                results.mainType = ''
	                results.sections = []
	                test()
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

var test = function() {
	var sender = getSender(textContents)
	results.sender = sender.result
	var content = getContentType(textContents)
	results.mainType = content.result
	if (content.result == contentTypes.multiPart) {
		var leftover = textContents.substring(content.endIndex)
		testMulti(leftover)
	} else {
		var encoding = getTransferEncoding(textContents)
		var media = getMediaQuery(textContents)
		var newSection = new Section(results.sections.length, textContents.substring(content.startIndex), content.result, encoding.result, media.result)
		results.sections.push(newSection)
	}
	console.log(results)
}

var parser = function(s, phrase, endPhrase) {
	var index1 = s.indexOf(phrase)
	if (index1 != -1) {
		var index2 = s.indexOf(endPhrase, index1)
		var string  = s.substring(index1 + phrase.length, index2)
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

var getQuery = function(s, phrase, endPhrase, message) {
	var query = parser(s, phrase, endPhrase)
	if (query.success) {
		console.log(message + ' is: ' + query.result)
	} else {
		console.log(message + ' not found.')
	}
	return query
}

var getSender = function(s) {
	var index1 = s.indexOf(searchPhrases.arcAuth)
	if (index1 != -1) {
		var query = getQuery(s, searchPhrases.sender, '\n', 'sender')
		return query
	} else {
		console.log(searchPhrases.arcAuth + ' not found')
	}
	return {
		success: false,
		result: 'none'
	}
}

var getContentType = function(s) {
	var query = getQuery(s, searchPhrases.contentType, ';', 'content type')
	return query
}

var getTransferEncoding = function(s) {
	var query = getQuery(s, searchPhrases.transferEncoding, '\n', 'transfer encoding')
	return query
}

var getMediaQuery = function(s) {
	var query = getQuery(s, searchPhrases.mediaQuery, '\n', 'media query')
	return query
}

var testMulti = function(s) {

	var index1 = s.indexOf(searchPhrases.boundary)
	var index2 = s.indexOf('\n', index1)
	var boundary = s.substring(index1 + searchPhrases.boundary.length, index2)
	boundary = trimQuotes(boundary)
	console.log('boundary identifier is: ' + boundary)

	var leftover = s.substring(index2)
	splitSections(leftover, boundary)

	results.sections.forEach(function(section) {
		console.log('Section' + section.id)
		var content = getContentType(section.text)
		var encoding = getTransferEncoding(section.text)
		var media = getMediaQuery(section.text)
		section.contentType = content.result
		section.transferEncoding = encoding.result
		section.mediaQuery = media.result
	})
}

var splitSections = function(s, boundary) {
	//getting indexes of all boundaries
	var placeHolder = 0
	var indexList = []
	var okay = true
	while (okay) {
		var nextBoundary = findNextBoundary(s.substring(placeHolder), boundary)
		if (nextBoundary.success && !indexList.includes(nextBoundary.index)) {
			placeHolder += nextBoundary.index + boundary.length
			indexList.push(placeHolder)
		} else {
			okay = false
			break
		}
	}
	//put according text into each section
	for (var i = 0; i<indexList.length-1; i++) {
		var text = s.substring(indexList[i], indexList[i+1])
		var newSection = new Section(results.sections.length, text)
		results.sections.push(newSection)
	}
	//console.log(results.sections)

}

var findNextBoundary = function(s, boundary) {
	console.log(s)
	var boundIndex = s.indexOf(boundary)
	if (boundIndex != -1) {
		console.log('next boundary found at: ' + boundIndex)
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

var trimQuotes = function(s) {
	//console.log(s)
	var index1 = s.indexOf('"')
	var string = s.substring(index1+1)
	//console.log(string)
	var index2 = string.indexOf('"')
	string = string.substring(0, index2)
	//console.log(string)
	return string
}

















