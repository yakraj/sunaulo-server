const registerhandler = (db, uniqid, bcrypt) => (req, res) => {
  const { password, mobile, firstname, lastname, address, location } = req.body;
  const uniquser = uniqid.process(firstname);
  const hash = bcrypt.hashSync(password);
  console.log(hash, mobile, firstname, lastname, uniquser);
  db.transaction((trx) => {
    trx
      .insert({
        username: uniquser,
        mobile: mobile,
        password: hash,
      })
      .into("usercrediantials")
      .returning("username")
      .then((UserName) => {
        return trx("userinfo")
          .insert({
            firstname: firstname,
            lastname: lastname,
            image: req.file ? req.file.filename : "avatar.png",
            username: UserName[0],
            address: address,
            location: `{${location}}`,
          })
          .then((response) => {
            db.select(
              "ui.firstname",
              "ui.lastname",
              "ui.address",
              "ui.image",
              "ui.username",
              "ucr.mobile"
            )
              .from("userinfo as ui")
              .leftJoin("usercrediantials as ucr", function () {
                this.on("ucr.username", "ui.username");
              })
              .where("ui.username", UserName[0])
              .then((respo) => {
                res.json(respo);
                // inserting extra from here
                db.insert({ username: UserName[0], likes: null })
                  .into("userlikes")
                  .then((response1) => {
                    db.insert({ username: UserName[0], hearts: null })
                      .into("userfavourites")
                      .then((response2) => {
                        var name = "";
                      });
                  });
              })
              .catch((err) => res.status(404).end());
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  });

  // console.log(uniquser)
  // console.log(hash)
};

module.exports = {
  registerhandler: registerhandler,
};
