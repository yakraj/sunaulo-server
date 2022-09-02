const subcatogerySuggestionHandler = (db) => (req, res) => {
  const { key } = req.body;
  db.select("subcatogery", "thumbnail")
    .from("subcatogeryreco")
    .limit(1)
    .where("keywords", "like", `%${key}%`)
    .then((response) => res.json(response))
    .catch((err) => res.status(404).end());
};

const SubCatogeryHandler = (db) => (req, res) => {
  const { subcatogery, thumbnail, keyword } = req.body;
  db.select("*")
    .from("subcatogeryreco")
    .insert({
      subcatogery: subcatogery,
      thumbnail: thumbnail,
      keywords: keyword,
    })
    .then((response) => res.json(response))
    .catch((err) => res.status(404).end());
};

module.exports = {
  subcatogerySuggestionHandler: subcatogerySuggestionHandler,
  SubCatogeryHandler: SubCatogeryHandler,
};
