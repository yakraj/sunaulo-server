const getFilteredAdsHandler = (db) => (req, res) => {
  const { keyword, subcatogery, filter } = req.body;

  db.select("title", "thumbnail", "price", "supercatogery")
    .from("archive")
    .where("tags", "like", `%${keyword}%`)
    .modify(function (queryBuilder) {
      if (subcatogery) {
        queryBuilder.andWhere("subcatogery", "=", subcatogery);
      }
    })
    // .modify(function(queryBuilder) {filter.map((fil,i)=> {queryBuilder.andWhere(`${filter[i].id}`, 'like', `%${filter[i].keyword}%`)})})
    .modify(function (queryBuilder) {
      filter.map((fil, i) => {
        console.log(filter[i].keyword);
        queryBuilder.andWhere(
          db.raw(
            `${filter[i].id} in (` +
              filter[i].keyword.map((_) => "?").join(",") +
              ")",
            [...filter[i].keyword]
          )
        );
      });
    })
    .then((response) => res.json(response))
    .catch((err) => res.status(500).end());
};

module.exports = {
  getFilteredAdsHandler: getFilteredAdsHandler,
};
