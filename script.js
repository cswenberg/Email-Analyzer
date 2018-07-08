

var textContents

var searchPhrases = {
	contentType: 'Content-Type: ',
	transferEncoding: 'Content-Transfer-Encoding: ',
	multiPart: 'multipart/alternative'
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

	var index1 = textContents.indexOf(searchPhrases.contentType)
	var index2 = textContents.indexOf(';', index1)
	var substring  = textContents.substring(index1 + searchPhrases.contentType.length,index2)
	console.log('content type is: ' + substring)
	if (substring == searchPhrases.multiPart) {
		testMulti('')
	} else {
		testSingle(textContents)
	}
}

var testSingle = function(s) {
	var index1 = s.indexOf(searchPhrases.transferEncoding)
	var index2 = s.indexOf('\n',index1)
	var substring = s.substring(index1 + searchPhrases.transferEncoding.length,index2)
	console.log('content transfer encoding is: ' + substring)

}

var testMulti = function(s) {



}