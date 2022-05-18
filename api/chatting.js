module.exports = (app,io) => {

function FilterClean(obj) {
  for (var propName in obj) {
    if (obj[propName] === null || obj[propName] === undefined || obj[propName] === "") {
      delete obj[propName];
    }
  }
  return obj
}


	const get = (req, res) => {
		const {limits, chatid} = req.body;
		app.db('chats').select('*').where('chatid', chatid).limit(limits+10).then(response =>
			{
			response.map((res,i) => newData  = FilterClean(response[i]))
			 res.json(response)})
	}
	









	const make = (req, res) => {
		const {chatid,
userfrom,
deleter,
text,
location,
images}= req.body;
		app.db('chats').insert({
			chatid: chatid, 
			userfrom: userfrom,
			deletest: deleter,
			text: text,
			location:location,
			images:images,
			date: new Date()

		}).then(ress=> app.db('chats').select('*').then(resss=> res.status(204).json(resss))).catch(error => res.status(400).json("couldn't add your chat'"))
	}
	return {get, make}
}