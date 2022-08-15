const getAdshandler = (db, st) => (req, res) => {
  const { lat, keyword, subcatogery, long, r, offset } = req.body;
  // const { keyword, subcatogery, distance } = req.body;
  // .limit(1).offset(1) these are very useful things for my work
  // it helps me to make request on ads by where to where
  // db.select('title','thumbnail', 'price', 'supercatogery', 'hearts').from('archive').where('tags', 'like', `%${keyword}%`).then(response => res.json(response))
  // this is previous
  //   db.select("title", "thumbnail", "price", "supercatogery", "adid", "address")
  //     .from("archive")
  //     .where("tags", "ilike", `%${keyword}%`)
  //     .orWhere("title", "ilike", `%${keyword}%`)
  //     .orWhere("description", "ilike", `%${keyword}%`)
  //     .modify(function (queryBuilder) {
  //       if (subcatogery) {
  //         queryBuilder.andWhere("subcatogery", "=", subcatogery);
  //       }
  //     })
  //     .then((response) => res.json(response));
  // };

  db("archive")
    .select(
      "title",
      "thumbnail",
      "price",
      "supercatogery",
      "adid",
      "address",
      st
        .distance("geo", st.geography(st.makePoint(lat, long)))
        .as("distanceAway")
    )
    .offset(offset)
    .orderBy("distanceAway")
    .where(st.dwithin("geo", st.geography(st.makePoint(lat, long)), r * 1000))
    // .where("title", "ilike", `%${keyword}%`)
    .where((bd) => {
      bd.orWhere("tags", "ilike", `%${keyword}%`).orWhere(
        "title",
        "ilike",
        `%${keyword}%`
      );
    })
    // .where("tags", "ilike", `%${keyword}%`)
    // .orWhere("description", "ilike", `%${keyword}%`)
    .modify(function (queryBuilder) {
      if (subcatogery) {
        queryBuilder.andWhere("subcatogery", "=", subcatogery);
      }
    })
    .then((response) => res.json(response))
    .catch((err) => res.status(500).json([]));
};

const GetChatsHandler = (db) => (req, res) => {
  const { userid } = req.body;
  // const selectCase = db.select(db.raw(`case when userid = 'kale77' then name end as us`)).from('archive')
  db.select(
    "ca.id",
    "ca.lastchat",
    "ca.productid",
    "ca.chatid",
    "ca.date",
    "ca.buyer",
    "ca.seller",
    // db.raw(`case when seller = '${userid}' then seller else buyer end as user`),
    "a.title",
    "a.thumbnail"
  )
    .from("chatarchive as ca")
    .leftJoin("archive as a", function () {
      this.on("a.adid", "ca.productid");
    })
    .where("ca.seller", "=", userid)
    .orWhere("ca.buyer", "=", userid)
    .then((response) => {
      res.json(response);
    });

  // db.select(db.raw(`case when userid = '${userid}' then name else avatar end as user`)).from('userdetail').then((ress) =>res.json(ress))
  // db.select(db.raw(`case when seller = '${userid}' then 'buyer' else 'seller' end as user`)).from('chatarchive')

  // db.select('*').from('chatarchive').havingNotNull('lastchat').then((ress) =>res.json(ress))
};

module.exports = {
  getAdshandler: getAdshandler,
  GetChatsHandler: GetChatsHandler,
};
