<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/tr/xhtml1/DTD/xhtml1-transitional.dtd"> 
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en"> 
<head>
	<title>Node Client</title>
	<link rel='stylesheet' href='inc/style.css' />
	
	<script type='text/javascript' src='inc/socket.io.js'></script>
	<script type='text/javascript' src='inc/jquery.min.js'></script>
	
	<script type='text/javascript'>
		var NodeClient = new (function() {
			var Console = {
				log: function(text, color) {
					if (typeof color == "string") {
						text = "<span style='color:"+color+";'>"+text+"</span>";
					}
					$('#console').append(text+"<br/>");
					scrollToBottom();
				}
			};
			this.init = function() {
				Console.log("Connect to a server by typing: connect &lt;server name&gt;");
				$('#command').bind('submit', function(e) {
					e.preventDefault();
					NodeClient.command($('#commandline').val());
				});
				$('#commandline').bind('keydown', function(e) {
					if (CurCommand == null) return;
					switch (e.keyCode) {
						case 38:
							CurCommand--;
							if (CurCommand < 0) {
								CurCommand = Commands.length;
								$('#commandline').val("");
							} else {
								$('#commandline').val(Commands[CurCommand]);	
							}
							break;
						case 40:
							CurCommand++;
							if (CurCommand > Commands.length - 1) {
								CurCommand = -1;
								$('#commandline').val("");
							} else {
								$('#commandline').val(Commands[CurCommand]);	
							}
							break;
					}
				}).focus();
				if (localStorage && localStorage.Commands) {
					Commands = JSON.parse(localStorage.Commands);
					CurCommand = Commands.length;
				}
			}
			var Commands = [];
			this.yo = function() {
				console.log(Commands);
			}
			var CurCommand = null;
			this.command = function(command) {
				Commands.push(command);
				CurCommand = Commands.length;
				if (localStorage) {
					localStorage.Commands = JSON.stringify(Commands);
				}
				$('#commandline').val("");
				Console.log(">> " + command, '#eaa');
				var run = command.match(/[^ ]+/)[0];
				var params = command.replace(/[^ ]+ /, '');
				switch(run) {
					case "connect":
						this.runConnect(params);
						break;
					case "emit":
						this.runEmit(params);
						break;
					case "changeserver":
						this.runChangeServer(params);
						break;
					default:
						Console.log("Unknown command");
				}
			}
			var Socket = [null];
			var CurSocket = 0;
			this.runConnect = function(server) {
				CurSocket = Socket.length;
				Console.log("Connecting to server #"+CurSocket+"...");
				Socket[CurSocket] = io.connect(server);
				// Grabbed this snippet from: http://stackoverflow.com/questions/10405070/socket-io-client-respond-to-all-events-with-one-handler
				var globalEvent = "*";
				Socket[CurSocket].$emit = function (name) {
				    if(!this.$events) return false;
				    for(var i=0;i<2;++i){
				        if(i==0 && name==globalEvent) continue;
				        var args = Array.prototype.slice.call(arguments, 1-i);
				        var handler = this.$events[i==0?name:globalEvent];
				        if(!handler) handler = [];
				        if ('function' == typeof handler) handler.apply(this, args);
				        else if (io.util.isArray(handler)) {
				            var listeners = handler.slice();
				            for (var i=0, l=listeners.length; i<l; i++)
				                listeners[i].apply(this, args);
				        } else return false;
				    }
				    return true;
				};
				Socket[CurSocket].id = CurSocket;
				Socket[CurSocket].on(globalEvent,function(event) {
				    var args = Array.prototype.slice.call(arguments, 1);
				    Console.log("Server ("+this.id+"): Event = "+event+"; Arguments = "+JSON.stringify(args), "#aae");
				});				
			}
			this.runEmit = function(params) {
				if (Socket[CurSocket] == null) {
					Console.log("You are not connected to a server.");
					return;
				}
				var name = params.match(/[^ ]+/)[0];
				var jsonData = params.replace(/[^ ]+ /, '');
				try {
					data = $.parseJSON(jsonData);
					Console.log("Client ("+CurSocket+"): Event = "+name+"; Arguments = "+jsonData, "#aea");
					Socket[CurSocket].emit(name, data);
				} catch(e) {
					Console.log("Invalid JSON data.");
				}
			}
			this.runChangeServer = function(params) {
				if (!isNaN(params) && params > 0 && params < Socket.length) {
					Console.log("Changing commands to server #"+params);
					CurSocket = params;
				}
			}
			var scrollToBottom = function() {
				var con = $('#console');
				con.scrollTop(con[0].scrollHeight - con.height());
			}
			
			$(document).ready(this.init);
			$(window).resize(scrollToBottom);
		});
	</script>
</head>
<body>
	<div class='container'>
		<div id="console"></div>
		<form id="command"><input type="text" id="commandline" /></form>
	</div>
</body>
</html>