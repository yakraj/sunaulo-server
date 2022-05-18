const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const fs = require('fs');
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const consign = require('consign')

const db = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: 'yakraj',
		database: 'neplx-app'
	}
});

const app = express();
const server = http.Server(app);
const io = socketio(server);
const port = 5001;



const getChatMessage = (body) => {
	return new Promise((resolve) =>
		db.select('*').from('chats')
		.then(response=>  resolve(response)) ) 

}

const CreateChatMessage = (body) => {
	const {chatid,userfrom,text} = body;
	return new Promise((resolve) => {
		db('chats').insert({
			chatid: chatid, 
			userfrom: userfrom,
			text: text,
			date: new Date()
		}).then(response => resolve(response))
	})
}



const Returningchats = (body)=> {
	console.log('ate')
	getChatMessage(body).then((result)=> io.emit("getChats",result))
}

const ReturningchatsCreate = (body) => {
	console.log('triggreds')

	CreateChatMessage(body).then((result) => io.on('getChats'))
}

io.on('connection', socket => {
	console.log('a user connected')

	socket.on('getChats', (user)=>{
		Returningchats(user);
	})

	socket.on('makeChats', (chats)=>{
	ReturningchatsCreate(chats)
	})

	socket.on('make message', msg => 
		{
		
			socket.emit('make message',msg);
				});
})



server.listen(port, ()=> console.log('server is running on port ' + port))