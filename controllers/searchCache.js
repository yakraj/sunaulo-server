const searchCacheHandler = (db) => (req, res) => {
	const {keyword} = req.body;
	db('searchcache').insert({
		keywords: keyword
	}).then(response => res.json('successfully insterted')).catch((err)=> res.status(400).json('error'))
}

module.exports = {
	searchCacheHandler: searchCacheHandler
}