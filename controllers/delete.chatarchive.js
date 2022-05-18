const deleteChatArchivehandler = (db) => (req,res)=>{
  const {chatid,userid} = req.body;
 db('chatarchive').where('chatid', chatid).del()
 .then(response => db('chats').where('chatid',chatid).del()
  .then(ress => 
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
    })
    )
  .catch(err => res.json(err))).catch(err => res.json(err))
}


module.exports = {
  deleteChatArchivehandler:deleteChatArchivehandler
}