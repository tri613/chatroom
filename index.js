const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('./server/chat-socket')(http);
const sessionMiddleware = require('./server/session-middleware');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;

app.use(sessionMiddleware);
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

app.get('/', (req, res) => {
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

app.use((req, res, next) => {
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

app.get('/chatroom', (req, res) => {
	res.sendFile(__dirname + '/public/chatroom.html');
});

http.listen(port, () => console.log(`listening on *:${port}`));