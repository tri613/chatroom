const io = require('socket.io');
const sessionMiddleware = require('./session-middleware');

module.exports = (http) => {
	const chat = io(http).of('/chat');
	
	chat.use((socket, next) => {
	    sessionMiddleware(socket.request, socket.request.res, next);
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
	});
};

function getRoomClients(io, room) {
	const clients = io.in(room).connected;
	const users = [];
	for (let id in clients) {
		const username = clients[id].username;
		users.push({id, username});
	}
	return users;
}
