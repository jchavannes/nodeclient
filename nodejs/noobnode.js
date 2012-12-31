/* Author: Jason Chavannes <jason.chavannes@gmail.com>
 * Date: 12/30/2012 */

// Load dependencies and create data stores
var io = require('socket.io').listen(9000);
var sockets = [];
var users = [];

// New connection
io.sockets.on('connection', function (socket) {

    // Add connection to socket store
    var sockId = sockets.length;
    var userId = false;
    sockets[sockId] = {socket: socket};
    sockets[sockId].socket.emit('serverMessage', {message:"Connected, welcome to Noob Node!"});

    // Get session key from client
    sockets[sockId].socket.on('setSession', function(data) {

        if (userId !== false) {
            sockets[sockId].socket.emit('serverMessage', {message:"Session already set."});
            return;
        }

        if (typeof data.sessionId == 'undefined') {
            data.sessionId = randomString(12);
            sockets[sockId].socket.emit('serverMessage', {message:"Generated new sessionId: "+data.sessionId});

        }
        sockets[sockId].sessionId = data.sessionId;

        // Check if user exists already
        for(var i = 0; typeof users[i] != 'undefined'; i++) {
            if(sockets[users[i].sockId].sessionId == data.sessionId) {
                sockets[sockId].socket.emit('serverMessage', {message:"Existing session id, welcome back."});
                userId = i;
                users[i].sockId = sockId;
                users[i].active = true;
            }
        }

        // Create new user
        if(userId === false) {
            sockets[sockId].socket.emit('serverMessage', {message:"New Session Id, creating new user."});
            userId = users.length;
            users[userId] = {
                name: null,
                sockId: sockId,
                active: true
            }
        }

        sockets[sockId].socket.on('setName', function(data) {
            var name = data.name.replace(/[^a-z0-9 ]+/gi, "");
            users[userId].name = name;
            sockets[sockId].socket.emit('serverMessage', {message:"Changed user name to "+name+"."});
        });

        sockets[sockId].socket.on('disconnect', function() {
            users[userId].active = false;
        });

    });

    sockets[sockId].socket.on('getUsers', function() {
        var sendUsers = [];
        for (var i = 0; i < users.length; i++) {
            if (users[i].active) {
                sendUsers.push(users[i]);
            }
        }
        sockets[sockId].socket.emit('sendUsers', {users:sendUsers});
    });

    sockets[sockId].socket.on('sendMessage', function(data) {
        var message = data.message.replace(/[^a-z0-9 !?.,():;&^%$#@\[\]\{\}\|\/\\\+\-\*"']+/gi, "");
        for (var i = 0; i < users.length; i++) {
            if (users[i].active) {
                sockets[users[i].sockId].socket.emit('getMessage', {name:users[userId].name, message:message});
            }
        }
    });

});

function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}