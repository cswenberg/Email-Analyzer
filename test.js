

var MailParser = require("mailparser-mit").MailParser;
var mailparser = new MailParser();

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log(`Correct syntax: node ${process.argv[1]} FILENAME`)
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

function decode(email) {
	// setup an event listener when the parsing finishes
	mailparser.on("end", function(mail){
		console.log("\n\n\n\nText body:", mail.text); // How are you today?
		console.log('\n\n\n\nHTML body:', mail.html)
	    console.log("From:", mail.from); //[{address:'sender@example.com',name:'Sender Name'}]
	    console.log("Subject:", mail.subject); // Hello world!
	    console.log('Attachments:', mail.attachments)
	    console.log('test finished')
	});
	 
	// send the email source to the parser
	mailparser.write(email);
	mailparser.end();

}
 


var emailEX = "From: 'Sender Name' <sender@example.com>\r\n"+
            "To: 'Receiver Name' <receiver@example.com>\r\n"+
            "Subject: Hello world!\r\n"+
            "\r\n"+
            "How are you today?";
 
