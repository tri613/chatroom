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

app.use(function(req, res, next) {
	if (!req.session.room || !req.session.name) {
		console.log('not okay');
		res.redirect('/');
	}
	next();
});

app.get('/chatroom', function(req, res) {
	res.sendFile(__dirname + '/public/chatroom.html');
});

chat.on('connection', (socket) => {
	const { room , name } = socket.request.session;
	socket.join(room);
	socket.emit('login', {room: room});
	socket.name = name;
	socket.broadcast.to(room).emit('new-user', {id: socket.id, name: name});
	socket.on('disconnect', () => socket.broadcast.emit('user-left', {name}));
	socket.on('new-chat-msg', ({msg}) => {
		chat.to(room).emit('update-chat-msg', { msg, name });
	});
})

http.listen(4000, function() {
  console.log('listening on *:4000');
});