const updateavatar = (db) => (req,res) => {
	console.log(req.body)
	db('userinfo').update({
		image: req.file.filename
	}).where('username', req.body.username).then(response=> {
		    db.select(
                "ui.firstname",
                "ui.lastname",
                "ui.address",
                "ui.image",
                "ui.username",
                "ucr.mobile"
                ).from('userinfo as ui')
            .leftJoin("usercrediantials as ucr", function () {
      this.on("ucr.username", "ui.username");
    })
    .where("ui.username", req.body.username).then(respo => res.json(respo))
	})
}

const updateName = (db)=> (req, res)=> {
	db('userinfo').update({
		firstname: req.body.firstname,
		lastname: req.body.lastname
	}).where('username' , req.body.username).then(resp => {
 db.select(
                "ui.firstname",
                "ui.lastname",
                "ui.address",
                "ui.image",
                "ui.username",
                "ucr.mobile"
                ).from('userinfo as ui')
            .leftJoin("usercrediantials as ucr", function () {
      this.on("ucr.username", "ui.username");
    })
    .where("ui.username", req.body.username).then(respo => res.json(respo))
	})
}


const updateMobile = (db) => (req, res) => {
	db('usercrediantials').update({
		mobile: req.body.mobile
	}).where('username', req.body.username).then(respo => {

		 db.select(
                "ui.firstname",
                "ui.lastname",
                "ui.address",
                "ui.image",
                "ui.username",
                "ucr.mobile"
                ).from('userinfo as ui')
            .leftJoin("usercrediantials as ucr", function () {
      this.on("ucr.username", "ui.username");
    })
    .where("ui.username", req.body.username).then(respo => res.json(respo))
	})
}

const updateLocation = (db) => (req, res) => {
const {address,location,username} = req.body;
    db('userinfo').update({
        address: address,
        location:`{${location}}`
    }).where('username', username).then(response  => {
        db.select('address', 'location').from('userinfo').where('username', username).then(ress=> res.json(ress))
    }).catch(error => res.json('sorry'))
}



module.exports = {
	updateavatar: updateavatar,
	updateName:updateName,
updateMobile:updateMobile,
updateLocation:updateLocation
}