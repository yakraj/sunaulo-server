const UserAdsHandler = (db) => (req, res) => {
	 db.select('title','thumbnail', 'price', 'supercatogery','address','status','adid')
	 .from('archive')
	 .where('seller', req.body.username)
	 .then(response => res.json(response)).catch(err => res.status(400).json('something went wrong.'))
}

module.exports ={
	UserAdsHandler:UserAdsHandler
}