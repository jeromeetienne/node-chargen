#!/usr/bin/env node

var sys		= require('sys');
var http	= require('http'); 

var create	= function(){
	// pattern which gonna be displayed
	var pattern	= "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefg";
	// create the http server
	var server	= http.createServer(function (request, response) {
		response.writeHead(200, {
			'Content-Type'		: 'text/plain',
			'Transfer-Encoding'	: 'identity'		// to force a non-chunked response
		});
		var nb_line	= 0;
		var stoploop	= false;
		// to findout when the client closes the connection
		request.connection.addListener('error', function(){
			stoploop	= true;
		});
		/**
		 * loop and deliver the usual chargen pattern until the end
		*/
		var main_loop	= function(){
			// if the client closes the connection, stop looping
			if(stoploop){
				response.end();
				return;
			}
			// compute the content to send
			var offset	= nb_line % pattern.length;
			var content	= pattern.substr(offset, pattern.length-offset) + pattern.substr(0, offset) + '\n';
			nb_line++;
			// write the content to the response
			response.write(content);
			// defer the next iteration 
			setTimeout(main_loop, 10);
		}
		// start looping
		main_loop();
	});
	// return the just-created server
	return server;
}

// export it via commonjs
exports.create	= create;


//////////////////////////////////////////////////////////////////////////////////
//		Main code							//
//////////////////////////////////////////////////////////////////////////////////
if( process.argv[1] == __filename ){
	server	= create();
	server.listen(8124, "127.0.0.1");
	sys.puts('Server running at http://127.0.0.1:8124/');
}
