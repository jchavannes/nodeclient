var socketUrl = ('https:' == document.location.protocol) ? '' : 'http://' + document.location.hostname + ':8242';
socketUrl += document.location.pathname;
var script = "<script type='text/javascript' src='" + socketUrl + "socket.io/socket.io.js' type='text/javascript'\></script\>";
document.write(script);
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
        $('#command').bind('submit', function(e) {
            e.preventDefault();
            NodeClient.command($('#commandline').val());
        });
        $('#console').bind('dblclick', function() {
            $('#commandline').focus();
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
                case 27:
                    $('#commandline').val("");
                    break;
            }
        }).focus();
        if (localStorage && localStorage.Commands) {
            Commands = JSON.parse(localStorage.Commands);
            CurCommand = Commands.length;
        }
        NodeClient.runHelp();
    };
    var Commands = [];
    this.yo = function() {
        return Commands;
    };
    var CurCommand = null;
    this.command = function(command) {
        command = command.replace("<script", "");
        Commands.push(command);
        CurCommand = Commands.length;
        if (localStorage) {
            localStorage.Commands = JSON.stringify(Commands);
        }
        $('#commandline').val("");
        Console.log(">> " + command, '#eaa');
        var run = command.match(/[^ ]+/)[0];
        var params = command.replace(/[^ ]+ /, '');
        if (tutorialActive && !this.tutorialCommand(run, params)) {
            return;
        }
        switch (run) {
            case "connect":
                this.runConnect(params);
                break;
            case "emit":
                this.runEmit(params);
                break;
            case "changeserver":
                this.runChangeServer(params);
                break;
            case "tutorial":
                this.runTutorial();
                break;
            case "info":
                this.runInfo();
                break;
            case "help":
                this.runHelp();
                break;
            default:
                Console.log("Unknown command");
        }
    };
    this.tutorialCommand = function(run, params) {
        if (run+" "+params == tutorialCommands[curTutorial].command || run == "skip") {
            curTutorial++;
            if (curTutorial == tutorialCommands.length) {
                curTutorial = null;
                tutorialActive = false;
                setTimeout(function() {
                    Console.log("<br/>Congratulations, you've completed the tutorial!", "#eea");
                    Console.log("Try sending messages by creating a user on another computer or browser.<br/>", "#eea");
                }, 500);
            } else {
                setTimeout(function() {
                    NodeClient.getTutorialMessage(curTutorial);
                }, 500);
            }
        }
        if (run == "tutorial") {
            Console.log("Use can use 'skip' or 'stop' to exit the tutorial.", "#eea");
            NodeClient.getTutorialMessage(curTutorial);
            return false;
        }
        if (run == "stop") {
            tutorialActive = false;
            Console.log("Tutorial stopped.<br/>","#eea");
            return false;
        } else if (run == "skip") {
            return false;
        }
        return true;
    };
    var Socket = [null];
    var CurSocket = 0;
    this.runConnect = function(server) {
        var parser = document.createElement('a');
        parser.href = server;

        CurSocket = Socket.length;
        Console.log("Connecting using socket #" + CurSocket + "...");

        if (parser.protocol == "wss:") {
            var options = {
                "transports": ["websocket"]
            };
            if (parser.pathname.length > 0) {
                options.path = parser.pathname + "socket.io";
            }
            //options.secure = true;
            Socket[CurSocket] = io.connect(parser.hostname, options);
        } else {
            Socket[CurSocket] = io.connect(server);
        }

        Socket[CurSocket].id = CurSocket;

        var onevent = Socket[CurSocket].onevent;
        Socket[CurSocket].onevent = function (packet) {
            var args = packet.data || [];
            onevent.call (this, packet);    // original call
            packet.data = ["*"].concat(args);
            onevent.call(this, packet);      // additional call to catch-all
        };
        Socket[CurSocket].on("*",function(event,data) {
            Console.log("Socket ("+this.id+"): Event = "+event+"; Arguments = "+JSON.stringify(data), "#aea");
        });
    };
    this.runEmit = function(params) {
        if (Socket[CurSocket] == null) {
            Console.log("You are not connected to a server.");
            return;
        }
        var name = params.match(/[^ ]+/)[0];
        var jsonData = params.replace(/[^ ]+ /, '');
        if (params == name) {
            jsonData = "{}";
        }
        try {
            var data = JSON.parse(jsonData);
            Console.log("Socket ("+CurSocket+"): Event = "+name+"; Arguments = "+jsonData, "#aae");
            Socket[CurSocket].emit(name, data);
        } catch(e) {
            Console.log("Invalid JSON data.");
        }
    };
    this.runChangeServer = function(params) {
        if (!isNaN(params) && params > 0 && params < Socket.length) {
            Console.log("Changing commands to server #"+params);
            CurSocket = params;
        } else {
            Console.log("Invalid server id.");
        }
    };
    var tutorialActive = false;
    var curTutorial;
    this.runTutorial = function() {
        Console.log("Starting tutorial. Use can use 'skip' or 'stop' to exit the tutorial.","#eea");
        curTutorial = 0;
        this.getTutorialMessage(curTutorial);
        tutorialActive = true;
    };
    var testServer = ('https:' == document.location.protocol) ? 'wss://' + document.location.hostname : 'ws://' + document.location.hostname + ':8242';
    testServer += document.location.pathname;
    var tutorialCommands = [
        {
            message: "Use the connect command to connect to the test server:",
            command: "connect " + testServer
        }, {
            message: "This server requires that you set your sessionId before becoming a user.  Use setSession to generate a session id:",
            command: "emit setSession"
        }, {
            message: "As you can see, you use the emit command to send events to the server:",
            command: "emit getUsers"
        }, {
            message: "Some events accept data inputs in JSON format.  To add your name this server has an event setName:",
            command: "emit setName {\"name\":\"John\"}"
        }, {
            message: "Check getUsers again to see if your name was set:",
            command: "emit getUsers"
        }, {
            message: "You can send messages to other users using sendMessage:",
            command: "emit sendMessage {\"message\":\"hey\"}"
        }
    ];
    this.getTutorialMessage = function(command) {
        if (typeof tutorialCommands[command] != 'undefined') {
            Console.log("<br/>"+tutorialCommands[command].message,"#eea");
            Console.log("<i style='color:#ccc;'>"+tutorialCommands[command].command+"</i><br/>");
        }
    };
    this.runInfo = function() {
        Console.log("== The Socket.io Client Console ==");
        Console.log("An easy way to debug your web sockets!")
        Console.log("View project on github: <a href='https://github.com/jchavannes/nodeclient' target='_blank'>https://github.com/jchavannes/nodeclient</a>");
        Console.log("View test server source: <a href='https://github.com/jchavannes/nodeclient/blob/master/ws/files/noobnode.js' target='_blank'>noobnode.js</a>");
        Console.log("Produced by <a href='http://noobsonly.com/projects' target='_blank'>noobsonly</a>.");
    };
    this.runHelp = function() {
        Console.log("Available commands:");
        Console.log("connect &lt;server name&gt; <i style='color:#ccc;'>connect to a server (eg. connect ws://socket.noobsonly.com:9000)</i>");
        Console.log("emit &lt;event name&gt; &lt;json data&gt; <i style='color:#ccc;'>sends message to socket server (eg. emit setSession {\"sessionId\":5})</i>");
        Console.log("changeserver &lt;server id&gt; <i style='color:#ccc;'>switch between servers if connected to more than one</i>");
        Console.log("tutorial <i style='color:#ccc;'>runs a brief tutorial</i>");
        Console.log("info <i style='color:#ccc;'>displays the information</i>");
        Console.log("help <i style='color:#ccc;'>displays this message</i>");
    };
    var scrollToBottom = function() {
        var con = $('#console');
        con.scrollTop(con[0].scrollHeight - con.height());
    };

    $(document).ready(this.init);
    $(window).resize(scrollToBottom);
});
