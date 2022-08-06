const getUiads = (db, st) => (req, res) => {
  const { length, lat, long, keyword, subcatogery } = req.body;
  // const long = length > 0 ? length :
  // .limit(1).offset(1) these are very useful things for my work
  // it helps me to make request on ads by where to where
  // db.select('title','thumbnail', 'price', 'supercatogery', 'hearts').from('archive').where('tags', 'like', `%${keyword}%`).then(response => res.json(response))
  lat && long
    ? db
        .select(
          "title",
          "thumbnail",
          "address",
          "price",
          "supercatogery",
          "adid",
          "seller",
          st
        .distance("geo", st.geography(st.makePoint(lat, long)))
        .as("distanceAway")
        )
        .offset(length)
        .where(
          st.dwithin("geo", st.geography(st.makePoint(lat, long)), 50 * 1000)
        )
        .limit(15)
        .from("archive")
        .orderBy("distanceAway")
        .then((response) => {
          res.json(response);
        })
        .catch((err) => res.status(404).json("unable"))
    : res.json("unable");
};


module.exports = {
  getUiads: getUiads,
};

// window.addEventListener("scroll", (e) => {
//   var reserver;
//   const last = document.querySelector(".HDOrGf");
//   const topValue = last.getBoundingClientRect().top;
//   var division = topValue / window.innerHeight;
//   var data = Math.trunc(division + 1);
//   reserver = data;
//   const newdata = reserver === data ? newdata : data;
//   console.log(newdata);
// });
