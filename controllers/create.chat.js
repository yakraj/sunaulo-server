const createChathandler = (db, uniqid) => (req, res) => {
  const { adid, buyer, seller, lastchat } = req.body;
  console.log(req.body);
  const uniqchat = uniqid.process(buyer + seller);

  db.transaction((trx) => {
    trx
      .insert({
        productid: adid,
        seller: seller,
        buyer: buyer,
        chatid: uniqchat,
        date: new Date(),
        lastchat: lastchat,
      })
      .into("chatarchive")
      .returning("chatid")
      .then((returned) => {
        console.log(uniqchat);

        return trx("chats")
          .insert({
            chatid: returned[0],
            userfrom: buyer,
            text: lastchat,
            date: new Date(),
          })
          .then((response) => {
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
              .where("ca.seller", "=", buyer)
              .orWhere("ca.buyer", "=", buyer)
              .then((rese) => {
                db.select("*")
                  .from("chats")
                  .where("chatid", uniqchat)
                  .then((ress) => {
                    res.json([rese[0], [uniqchat, ress[0]]]);
                  });
              });
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(500).end());
};

const Chatuser = (db) => (req, res) => {
  const { userid } = req.body;
  db.select("firstname", "lastname", "image")
    .from("userinfo")
    .where("username", userid)
    .then((response) => res.json(response))
    .catch((err) => res.status(500).end());
};

module.exports = {
  createChathandler: createChathandler,
  Chatuser: Chatuser,
};
