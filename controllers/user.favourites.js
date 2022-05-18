const getFavouritesHandler = (db) => (req, res) => {
	db.select('hearts').from('userfavourites').where('username', req.body.username).then(response => res.json(response))
	.catch(err => res.status(400).json('unable to get favourites'))
}

const updateFavouritesHandler = (db) => (req,res) => {
	db('userfavourites').update({
		hearts: `{${req.body.hearts}}`
	}).where('username', req.body.username).then(ress => {
db.select('hearts').from('userfavourites').where('username', req.body.username).then(response => res.json(response))
	})
	.catch(err => res.status(400).json('unable to update favourites'))
}


const getFavouriteadsHandler = (db) => (req, res) => {
	// db.select('title').from('archive')
	var myArray = req.body.ads
	db.raw('select "title", "thumbnail", "address", "price", "supercatogery", "adid" from archive where adid in (' + myArray.map(_ => '?').join(',') + ')', [...myArray])
// db.raw('select title from archive where adid in (?)', [])
	// .where('adid', '4d2ee2e4-59ca-47fc-b156-0962182d820e.jpga6okxxcdgwu')
	.catch(err => res.status(400).json('unable to get any related data')).then(response => res.json(response.rows))
}
module.exports = {
	getFavouritesHandler:getFavouritesHandler,
	updateFavouritesHandler:updateFavouritesHandler,
	getFavouriteadsHandler:getFavouriteadsHandler
}