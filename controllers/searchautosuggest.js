const autoSuggestHandler = (db) => (req, res) => {
  const { keyword } = req.body;
  db.select("keywords")
    .from("searchcache")
    .where("keywords", "like", `%${keyword}%`)
    .limit(5)
    .then((response) => res.json(response))
    .catch((err) => res.status(404).end());
  // .catch((err)=>status(400).json('not found similer keywords'))
};

module.exports = {
  autoSuggestHandler: autoSuggestHandler,
};
