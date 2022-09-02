const filterableValuesHandler = (db) => (req, res) => {
  const { keyword, subcatogery, filterable } = req.body;
  var Keys = [];
  var FilterKeys = [];
  db.select(`${filterable}`)
    .from("archive")
    .where("tags", "like", `%${keyword}%`)
    .modify(function (queryBuilder) {
      if (subcatogery) {
        queryBuilder.andWhere("subcatogery", "=", subcatogery);
      }
    })
    .then((response) => {
      response.map((val, i) => {
        Keys.push(Object.values(response[i]));
      });
      Keys.map((nn, i) => (FilterKeys = [...FilterKeys, ...Keys[i]]));
      const uniqueValue = [...new Set(FilterKeys)];
      res.json(uniqueValue);
    })
    .catch((err) => res.status(404).end());
};

module.exports = {
  filterableValuesHandler: filterableValuesHandler,
};
