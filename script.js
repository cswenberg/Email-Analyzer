

var textContents

var searchPhrases = {
	contentType: 'Content-Type: ',
	transferEncoding: 'Content-Transfer-Encoding: ',
	multiPart: 'multipart/alternative',
	boundary: 'boundary='
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
	var content = getContentType(textContents)
	results.mainType = content.result
	if (content == contentTypes.multiPart) {
		var leftover = textContents.substring(content.endIndex)
		testMulti(leftover)
	} else {
		var encoding = getTransferEncoding(textContents)
		var newPart = new SinglePart(content.result, encoding.result, results.contents.length)
		results.contents.push(newPart)
	}
	console.log(results)
}

var getContentType = function(s) {
	var index1 = s.indexOf(searchPhrases.contentType)
	if (index1 != -1) {
		var index2 = s.indexOf(';', index1)
		var substring  = s.substring(index1 + searchPhrases.contentType.length,index2)
		console.log('content type is: ' + substring)
		return {
			success: true,
			result: substring,
			endIndex: index2
		}
	} else {
		console.log('no content type found.')
		return {
			success: false,
			result: 'None'
		}
	}
}

var getTransferEncoding = function(s) {
	var index1 = s.indexOf(searchPhrases.transferEncoding)
	if (index1 != -1) {
		var index2 = s.indexOf('\n',index1)
		var substring = s.substring(index1 + searchPhrases.transferEncoding.length,index2)
		console.log('content transfer encoding is: ' + substring)
		return {
			success: true,
			result: substring,
			endIndex: index2
		}
	} else {
		console.log('no content transfer encoding found.')
		return {
			success: false,
			result: 'None'
		}
	}

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

















