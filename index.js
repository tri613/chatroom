const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const bodyParser = require('body-parser');
const session = require('express-session');
const sessionMiddleware = session({
  secret: 'keyboard cat',
  cookie: {}
});

const chat = io.of('/chat');
chat.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(sessionMiddleware);
let _g = 0;
app.use((req, res, next) => {
	_g++;
	console.log(`${req.method} ${req.url} : ${_g}`);
	next();
})
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/rooms.html');
});

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies

app.post('/register', (req, res) => {
	const { room, name } = req.body;
	req.session.room = room;
	req.session.name = name;
	res.redirect('/chatroom');
});

chat.use((socket, next) => {
	console.log('io check');
	const { room , name } = socket.request.session;
	console.log(room , name);

	if (room && room !== undefined && name && name !== undefined) {
		console.log('io check ok');
	} else {
		console.log(`io check fail, disconnent client ${socket.id}`);
		socket.disconnect();
	}
	next();
});

app.use(function(req, res, next) {
	const { room, name } = req.session;
	console.log(room, name);
	if (room && room !== undefined && name && name !== undefined) {
		next();
	} else {
		console.log('not okay');
		res.redirect('/');
		return;
	}
});

app.get('/chatroom', function(req, res) {
	res.sendFile(__dirname + '/public/chatroom.html');
});

chat.on('connection', (socket) => {
	const { room , name } = socket.request.session;
	socket.username = name;

	console.log('connection', socket.username);
	socket.join(room);
	socket.emit('login', {room: room});
	socket.broadcast.to(room).emit('new-user', {id: socket.id, name: name});
	socket.on('disconnect', () => socket.broadcast.emit('user-left', {name}));
	socket.on('new-chat-msg', ({msg}) => {
		chat.to(room).emit('update-chat-msg', { msg, name });
	});
	getRoomsClients();
})

http.listen(4000, function() {
  console.log('listening on *:4000');
});

function getRoomsClients(room) {
	const clients = chat.in(room).connected;
	const users = [];
	for (let id in clients) {
		const username = clients[id].username;
		users.push({id, username});
	}
	return users;
}