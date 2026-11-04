/* Author: Jason Chavannes <jason.chavannes@gmail.com>
 * Date: 12/30/2012 */

const crypto = require('crypto');
const { Server } = require('socket.io');

const PORT = parseInt(process.env.PORT, 10) || 8242;
const MAX_USERS = 1000;

const io = new Server(PORT, { maxHttpBufferSize: 10 * 1024 });

// sessionId -> {name, active, socket}
const users = new Map();

function serverMessage(socket, message) {
    socket.emit('serverMessage', { message: message });
}

function isValidSessionId(id) {
    return typeof id === 'string' && /^[A-Za-z0-9]{1,64}$/.test(id);
}

// New connection
io.on('connection', function (socket) {

    console.log('new connection');

    let user = null;
    serverMessage(socket, "Connected, welcome to Noob Node!");

    // Get session key from client
    socket.on('setSession', function (data) {

        console.log('received setSession');

        if (user !== null) {
            serverMessage(socket, "Session already set.");
            return;
        }

        data = Object(data);
        if (typeof data.sessionId === 'undefined') {
            data.sessionId = randomString(12);
            serverMessage(socket, "Generated new sessionId: " + data.sessionId);
        }
        if (!isValidSessionId(data.sessionId)) {
            serverMessage(socket, "Invalid sessionId.");
            return;
        }

        // Check if user exists already
        user = users.get(data.sessionId);
        if (user) {
            serverMessage(socket, "Existing session id, welcome back.");
            if (user.socket && user.socket !== socket) {
                user.socket.disconnect(true);
            }
        } else {
            serverMessage(socket, "New Session Id, creating new user.");
            if (users.size >= MAX_USERS) {
                for (const [id, u] of users) {
                    if (!u.active) {
                        users.delete(id);
                    }
                }
            }
            if (users.size >= MAX_USERS) {
                serverMessage(socket, "Server full.");
                user = null;
                return;
            }
            user = { name: null, active: false, socket: null };
            users.set(data.sessionId, user);
        }
        user.active = true;
        user.socket = socket;
    });

    socket.on('setName', function (data) {
        if (user === null) {
            serverMessage(socket, "Set a session first.");
            return;
        }
        data = Object(data);
        if (typeof data.name !== "string") {
            serverMessage(socket, "Invalid name.");
            return;
        }
        const name = data.name.replace(/[^a-z0-9 ]+/gi, "").slice(0, 32);
        user.name = name;
        serverMessage(socket, "Changed user name to " + name + ".");
    });

    socket.on('getUsers', function () {
        const sendUsers = [];
        for (const u of users.values()) {
            if (u.active) {
                sendUsers.push({ name: u.name, active: u.active });
            }
        }
        socket.emit('sendUsers', { users: sendUsers });
    });

    socket.on('sendMessage', function (data) {
        if (user === null) {
            serverMessage(socket, "Set a session first.");
            return;
        }
        data = Object(data);
        if (typeof data.message !== "string") {
            serverMessage(socket, "Invalid message.");
            return;
        }
        const message = data.message.replace(/[^a-z0-9 !?.,():;&^%$#@\[\]\{\}\|\/\\\+\-\*"']+/gi, "").slice(0, 1000);
        for (const u of users.values()) {
            if (u.active) {
                u.socket.emit('getMessage', { name: user.name, message: message });
            }
        }
    });

    socket.on('disconnect', function () {
        console.log("disconnect");
        if (user !== null && user.socket === socket) {
            user.active = false;
            user.socket = null;
        }
    });

});

function randomString(length) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const bytes = crypto.randomBytes(length);
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars[bytes[i] % chars.length];
    }
    return str;
}
