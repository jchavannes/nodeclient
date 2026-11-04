// Runs the browser console script in a stubbed DOM and checks what it
// hands to io.connect. Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../http/webroot/inc/nodeclient.js'), 'utf8');

function connect(server, location) {
    let called;
    const el = { append() {}, scrollTop() {}, height() { return 0; }, ready() {}, resize() {}, 0: { scrollHeight: 0 } };
    const context = {
        document: {
            location: new URL(location || 'http://localhost:8081/'),
            write() {},
            createElement() { return new URL('http://localhost:8081/'); }
        },
        window: {},
        $() { return el; },
        io: { connect(url, options) { called = { url, options }; return { onAny() {}, on() {} }; } }
    };
    vm.runInNewContext(source, context);
    context.NodeClient.runConnect(server);
    return called;
}

test('ws URL without path gets the default socket.io path', () => {
    const c = connect('ws://localhost:8242/');
    assert.equal(c.url, 'ws://localhost:8242');
    assert.equal(c.options.path, '/socket.io');
    assert.equal(JSON.stringify(c.options.transports), '["websocket"]');
});

test('ws URL with /socket.io/ suffix is not doubled', () => {
    const c = connect('wss://example.com/socket.io/');
    assert.equal(c.url, 'wss://example.com');
    assert.equal(c.options.path, '/socket.io');
});

test('ws URL with a prefix keeps it in the path', () => {
    const c = connect('wss://example.com/app/');
    assert.equal(c.options.path, '/app/socket.io');
    assert.equal(connect('wss://example.com/app/socket.io/').options.path, '/app/socket.io');
});

test('ws URL keeps its query string', () => {
    const c = connect('ws://localhost:8242/?token=secret');
    assert.equal(new URL(c.url).searchParams.get('token'), 'secret');
    assert.equal(connect('wss://example.com/socket.io/?a=1&b=2').url, 'wss://example.com?a=1&b=2');
});

test('http URLs are passed through untouched', () => {
    const c = connect('http://example.com/chat?x=1');
    assert.equal(c.url, 'http://example.com/chat?x=1');
    assert.equal(c.options, undefined);
});
