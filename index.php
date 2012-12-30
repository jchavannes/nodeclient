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
			}
			this.command = function(command) {
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
					default:
						Console.log("Unknown command");
				}
			}
			var Socket = null;
			this.runConnect = function(server) {
				Console.log("Connecting to server...", "#eaa");
				if (Socket != null) {
					Socket.disconnect();
					Socket = {};
				}
				Socket = io.connect(server);
				var globalEvent = "*";
				Socket.$emit = function (name) {
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
				Socket.on(globalEvent,function(event){
				    var args = Array.prototype.slice.call(arguments, 1);
				    Console.log("Server Event = "+event+"; Arguments = "+JSON.stringify(args), "#aae");
				});				
			}
			this.runEmit = function(params) {
				if (Socket == null) {
					Console.log("You are not connected to a server.");
					return;
				}
				var name = params.match(/[^ ]+/)[0];
				var jsonData = params.replace(/[^ ]+ /, '');
				try {
					data = $.parseJSON(jsonData);
					Console.log("Client Event = "+name+"; Arguments = "+jsonData, "#eaa");
					Socket.emit(name, data);
				} catch(e) {
					Console.log("Invalid JSON data.");
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