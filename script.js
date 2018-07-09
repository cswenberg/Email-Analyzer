

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

var SinglePart = function(contentType, transferEncoding, id) {
	this.contentType = contentType
	this.transferEncoding = transferEncoding
	this.id = id
}

var results = {
	sender: '',
	mainType: '',
	contents: []
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
	                results.contents = []
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
		var newPart = new SinglePart(content.result, encoding.result, results.contents.length)
		results.contents.push(newPart)
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
	var hasNext = true
	var sectionNum = 1
	while (hasNext) {
		//console.log(leftover)
		var section = findNextBoundary(leftover, boundary) 
		if (section.success) {
			console.log('Section ' + sectionNum)
			var content = getContentType(section.text)
			if (content.success) {
				var encoding = getTransferEncoding(section.text)
				leftover = section.text.substring(encoding.endIndex)
				var newPart = new SinglePart(content.result, encoding.result, results.contents.length)
				results.contents.push(newPart)
			} else {
				hasNext = false
				console.log('terminating')
				continue
			}
		} else {
			hasNext = false
			continue
		}
		sectionNum++
	}

}

var findNextBoundary = function(s, boundary) {
	var boundIndex = s.indexOf(boundary)
	if (boundIndex != -1) {
		console.log('next boundary found')
		//console.log(s.substring(boundIndex))
		return {
			success: true,
			text: s.substring(boundIndex)
		}
	}	else {
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

















