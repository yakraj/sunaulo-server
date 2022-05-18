module.exports = (app,io) => {
	const get = (req, res) => {
		app.db('trycase').select('*').then(response => res.json(response))
	}
	const create = (req, res) => {
		const {sell, buy}= req.body;
		app.db('trycase').insert({seller: sell, buyer: buy}).then(ress=> res.status(204).send(ress))
	}
	return {get, create}
}