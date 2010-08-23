#!/usr/bin/env node

var http	= require('http'); 

var create	= function(ctor_opts){
	//////////////////////////////////////////////////////////////////////////
	//		class variables						//
	//////////////////////////////////////////////////////////////////////////	
	// alias opts for readability and default values
	var verbose	= ctor_opts.verbose 	|| 0;
	var loop_delay	= ctor_opts.loop_delay	|| 5;
	var hostname	= ctor_opts.hostname	|| '127.0.0.1';
	var port	= ctor_opts.port	|| 8124;

	//////////////////////////////////////////////////////////////////////////
	//		ctor/dtor						//
	//////////////////////////////////////////////////////////////////////////
	var ctor	= function(){
		server_start();
	}
	var dtor	= function(){
		//console.log("Stop neoip rpc call");
		server_stop();
	}
	
	//////////////////////////////////////////////////////////////////////////
	//		server							//
	//////////////////////////////////////////////////////////////////////////
	var server	= null;
	var nb_cnx	= 0;
	// pattern which gonna be displayed
	var pattern	= "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefg";
	var server_start	= function(){
		// create the http server
		server	= http.createServer(function (request, response) {
			// update nb_cnx: add this connection
			nb_cnx		+= 1;
			if( verbose > 0 )	console.log("Client connected ("+nb_cnx+' now)');
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
			var response_stop	= function(){
				// update nb_cnx: remove this connection
				nb_cnx		-= 1;
				if( verbose > 0 )	console.log("Client disconnected ("+nb_cnx+' now)');
				response.end();			
			}
			/**
			 * loop and deliver the usual chargen pattern until the end
			*/
			var main_loop_get	= function(){
				// if the client closes the connection, stop looping
				if(stoploop){
					response_stop();
					return;
				}
				// compute the content to send
				var offset	= nb_line % pattern.length;
				var content	= pattern.substr(offset, pattern.length-offset) + pattern.substr(0, offset) + '\n';
				nb_line++;
				// write the content to the response
				response.write(content);
				// log to debug
				if( verbose > 1 )	console.log("One line written");
				// defer the next iteration 
				setTimeout(main_loop_get, loop_delay);
			}
			// start looping
			if( request.method == "GET" ){
				main_loop_get();
			}else if( request.method == "HEAD" ){
				response_stop();
			}
		});
		server.listen(port, hostname);
	}
	var server_stop	= function(){
		server.close();
	}

	//////////////////////////////////////////////////////////////////////////
	//		run initialisation					//
	//////////////////////////////////////////////////////////////////////////
	// call the contructor
	ctor();
	// return the public properties
	return {
		destroy		: dtor,
		nb_clients	: function(){ return nb_cnx;				},
		client_url	: function(){ return "http://"+hostname+":"+port+"/"	}
	}
}

// export it via commonjs
exports.create	= create;


//////////////////////////////////////////////////////////////////////////////////
//		Main code							//
//////////////////////////////////////////////////////////////////////////////////
if( process.argv[1] == __filename ){
	//////////////////////////////////////////////////////////////////////////////////
	//	parse cmdline								//
	//////////////////////////////////////////////////////////////////////////////////
	// cmdline_opts default
	cmdline_opts	= {
		verbose		: 0,
		loop_delay	: null,
		hostname	: null,
		port		: null
	};
	var optind	= 2;
	for(;optind < process.argv.length; optind++){
		var key	= process.argv[optind];
		var val	= process.argv[optind+1];
		//console.log("key="+key+" val="+val);
		if( key == "-a" || key == "--hostname" ){
			cmdline_opts.hostname	= val;
			optind		+= 1;
		}else if( key == "-p" || key == "--port" ){
			cmdline_opts.port	= parseInt(val);
			optind		+= 1;
		}else if( key == "-l" || key == "--loop_delay" ){
			cmdline_opts.loop_delay	= parseInt(val);
			optind		+= 1;
		}else if( key == "-v" || key == "--verbose" ){
			cmdline_opts.verbose		+= 1;
		}else if( key == "-h" || key == "--help" ){
			console.log("usage: node-chargen [-v] [-l n_msec] [-a hostname] [-p port]");
			console.log("");
			console.log("Provide a chargen-like on top of a webserver.");
			console.log("");
			console.log("-a|--hostname host\tSet the address to listen on.");
			console.log("-p|--port port\t\tSet the port to listen on.");
			console.log("-l|--loop_delay msec\tSet the delay between each line (default to 5-msec).");
			console.log("-v|--verbose\t\tIncrease the verbose level (for debug).");
			console.log("-h|--help\t\tDisplay the inline help.");
			process.exit(0);
		}else{
			// if the option doesnt exist, consider it is the first non-option parameters
			break;
		}
	}

	// build ctor_opts
	ctor_opts	= {}
	ctor_opts.hostname	= cmdline_opts.hostname		|| null;
	ctor_opts.port		= cmdline_opts.port		|| null;
	ctor_opts.loop_delay	= cmdline_opts.loop_delay	|| null;
	ctor_opts.verbose	= cmdline_opts.verbose		|| null;
	// create chargen
	chargen	= create(ctor_opts);
	console.log('Server running at '+chargen.client_url());
}
