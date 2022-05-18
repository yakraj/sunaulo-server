const http = require("http");
const fs = require("fs");
const express = require("express");
const cors = require('cors');
const knex = require('knex');
const bodyParser = require('body-parser');
/*
GET /poll
Get the messages
GET /page
Serve the client app
POST /message
To send the message
*/
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
app.use(bodyParser.json());
app.use(cors());



var pool = [];
function handlePoll(req, res) {
	// console.log(req.body)
  pool.push({id: req.body.user, Res: [res]});
console.log(pool)
}
function chatSelector() {
    return new Promise((resolve)=>   db.select('*').from('fake').then(response => resolve(response))
)
}

function handlePage(req, res) {
  fs.createReadStream(__dirname + "/client.html").pipe(res);
}
function handlePage1(req, res) {
  fs.createReadStream(__dirname + "/client.html").pipe(res);
}

function emitMessage(message,id) {
	 // db.select('*').from('fake').then(response => response.json())
	findRes = pool.filter((x) => x.id === id)
	pool = pool.filter((x) => x.id !== id);

	console.log(pool)
  for (let res of findRes){
  	for (let ret of res.Res) db.select('*').from('fake').where('name', id).then(response => ret.json(response)) 
  } ;

	// pool=pool.filter((x) => x.id !== id)
	// console.log(pool)
}

function handleMessage(req, res) {
  const {message, id} = req.body;
// console.log(message)
    emitMessage(message, id);
    res.end();
}


app.get('/page', (req, res)=> {
	handlePage(req, res);
})

app.post('/poll', (req, res)=> {
	console.log(req.body)
	handlePoll(req, res);
})


app.post('/message', (req, res)=> {
	// console.log(req)
handleMessage(req, res)
})




// http
//   .createServer((req, res) => {
//     let method = req.method;
//     let url = req.url;
//     if (method === "GET") {
//       if (url === "/page") handlePage(req, res);
//       else if (url === "/page1") handlePage1(req, res);
//       else if (url === "/poll") handlePoll(req, res);
//     } else if (method === "POST" && url === "/message") handleMessage(req, res);
//     else req.end();
//   })
//   .listen(5000)
//   .on("listening", () => {
//     console.log("I am listening on port 5000!");
//   });

app.listen(5000, () => console.log("I am listening on port 5000!"))