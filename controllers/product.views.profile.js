function FilterClean(obj) {
  for (var propName in obj) {
    if (
      obj[propName] === null ||
      obj[propName] === undefined ||
      obj[propName] === ""
    ) {
      delete obj[propName];
    } else if (propName == "product_id") {
      delete obj[propName];
    } else if (propName == "id") {
      delete obj[propName];
    } else if (propName == "supercatogery") {
      delete obj[propName];
    }
  }
  return obj;
}
const Productprofilehandler = (db) => (req, res) => {
  ProductViwshandler(db, req);
  db.select("seller", "mobile")
    .from("archive")
    .where("adid", req.body.adid)
    .then((response) => {
      db.select("image", "firstname", "lastname")
        .where("username", response[0].seller)
        .from("userinfo")
        .then((ress) => {
          db.select("views")
            .from("productviews")
            .where("adid", req.body.adid)
            .then((dualres) => {
              res.json([
                dualres[0],
                ress[0],
                response[0].seller,
                response[0].mobile,
              ]);
            });
        });
    });
};
const ProductViwshandler = (db, req) => {
  db("productviews")
    .update({
      views: db.raw("views+1"),
    })
    .where("adid", req.body.adid)
    .then((response) => {
      db.select("views")
        .from("productviews")
        .where("adid", req.body.adid)
        .then((ress) => {});
    });
};

const ProductInfohandler = (db) => (req, res) => {
  db.select("supercatogery")
    .from("archive")
    .where("adid", req.body.adid)
    .then((response) => {
      db.select("*")
        .from(response[0].supercatogery)
        .where("product_id", req.body.adid)
        .then((rese) => {
          FilterClean(rese[0]);
          db.select("description","date")
            .from("archive")
            .where("adid", req.body.adid)
            .then((data) => {
              db.select("images")
                .from("productimage")
                .where("adid", req.body.adid)
                .then((respon) => {
                  db.select("lat", "long")
                    .from("archive")
                    .where("adid", req.body.adid)
                    .then((resloc) => {
                      res.json([rese[0], data[0], respon[0], resloc[0]]);
                    });
                });
            });
        });
    });
};

module.exports = {
  Productprofilehandler: Productprofilehandler,
  ProductViwshandler: ProductViwshandler,
  ProductInfohandler: ProductInfohandler,
};
