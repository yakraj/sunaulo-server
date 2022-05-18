module.exports = app => {
	app.post('/getmessages', app.api.message.get)
	app.post('/messages', app.api.message.create)
	app.post('/getchats', app.api.chatting.get)
	app.post('/makechats', app.api.chatting.make)
}