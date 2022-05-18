const uploadImageHandler = (db) => (req, res, next) => {
  const mapp = () =>
    req.files.map((item, i) => {
      return req.files[i].filename;
    });

  // const findthumbnail = mapp().find((x) => x.includes(req.body.thumbnail));

  console.log(mapp());
  console.log(req.body.thumbnail);
  db("productimage")
    .insert({
      adid: req.body.adid,
      images: `{${mapp()}}`,
    })
    .then((response) => {
      db("archive")
        .update("thumbnail", req.body.thumbnail)
        .where("adid", req.body.adid)
        .then((response) => res.end());
    });
};

module.exports = {
  uploadImageHandler: uploadImageHandler,
};
