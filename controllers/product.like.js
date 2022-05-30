const UserGetlikehandler = (db) => (req, res) => {
  db.select("likers")
    .from("productlike")
    .where("adid", req.body.adid)
    .then((rese) => {
      var response = rese[0].likers == null ? [{ likers: [] }] : rese;
      findInc = response[0].likers.includes(req.body.username);

      res.json(
        response[0].likers == null || response[0].likers.length == 0
          ? [findInc, 0]
          : [findInc, response[0].likers.length]
      );

      // res.json(findInc ? [findInc,response[0].likers.length-1] : [findInc, response[0].likers == null ? 1:response[0].likers.length+1])

      // res.json(response[0].likers == null || response[0].likers.length == 0 ? 0 : response[0].likers.length);
    });
};

const ProductOnlyLikeHandler = (db) => (req, res) => {
  db.select("likers")
    .from("productlike")
    .where("adid", req.body.adid)
    .then((response) => {
      res.json(
        response[0].likers == null || response[0].likers.length == 0
          ? 0
          : response[0].likers.length
      );
    });
};

const Userlikeshandler = (db, req) => {
  db.select("likes")
    .from("userlikes")
    .where("username", req.body.username)
    .then((rese) => {
      console.log(rese);
      var response = rese[0].likes == null ? [{ likes: [] }] : rese;

      findInc = response[0].likes.includes(req.body.adid);
      findInc
        ? db("userlikes")
            .update({
              likes: `{${response[0].likes.filter(
                (x) => x !== req.body.adid
              )}}`,
            })
            .where("username", req.body.username)
            .then((reso) => {})
        : db("userlikes")
            .update({
              likes:
                response[0].likes == null || response[0].likes.length == 0
                  ? `{${[req.body.adid]}}`
                  : `{${[...response[0].likes, req.body.adid]}}`,
            })
            .where("username", req.body.username)
            .then((reso) => {})
            .catch((err) => console.log(err));
    });
};
const ProductLikeHandler = (db) => (req, res) => {
  Userlikeshandler(db, req);
  db.select("likers")
    .from("productlike")
    .where("adid", req.body.adid)
    .then((rese) => {
      var response = rese[0].likers == null ? [{ likers: [] }] : rese;
      findInc = response[0].likers.includes(req.body.username);
      res.json(
        findInc
          ? [!findInc, response[0].likers.length - 1]
          : [
              !findInc,
              response[0].likers == null ? 1 : response[0].likers.length + 1,
            ]
      );

      findInc
        ? db("productlike")
            .update({
              likers: `{${response[0].likers.filter(
                (x) => x !== req.body.username
              )}}`,
            })
            .where("adid", req.body.adid)
            .then(() => {})
        : db("productlike")
            .update({
              likers:
                response[0].likers == null || response[0].likers.length == 0
                  ? `{${[req.body.username]}}`
                  : `{${[...response[0].likers, req.body.username]}}`,
            })
            .where("adid", req.body.adid)
            .then((res) => {})
            .catch((err) => console.log(err));
    });
};

module.exports = {
  ProductLikeHandler: ProductLikeHandler,
  UserGetlikehandler: UserGetlikehandler,
  ProductOnlyLikeHandler: ProductOnlyLikeHandler,
};
