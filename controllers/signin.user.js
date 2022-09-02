const signinhandler = (db, bcrypt) => (req, res) => {
  db.select("mobile", "password", "username")
    .from("usercrediantials")
    .where("mobile", "=", req.body.mobile)
    .then((data) => {
      var isValid = bcrypt.compareSync(req.body.key, data[0].password);
      console.log(isValid);
      if (isValid) {
        return db
          .select(
            "ui.firstname",
            "ui.lastname",
            "ui.address",
            "ui.location",
            "ui.image",
            "ui.username",
            "ucr.mobile"
          )
          .from("userinfo as ui")
          .leftJoin("usercrediantials as ucr", function () {
            this.on("ucr.username", "ui.username");
          })
          .where("ui.username", data[0].username)
          .then((respo) => res.json(respo))
          .catch((err) => res.status(404).json("Wrong Mobile or Password"));
      } else {
        res.status(404).json("Wrong Mobile or Password");
      }
    })
    .catch((err) => res.status(404).json("Wrong Mobile or Password"));
};

const NumberValidateHandler = (db) => (req, res) => {
  db.select("*")
    .from("usercrediantials")
    .where("mobile", req.body.mobile)
    .then((response) => res.send(response.length ? true : false))
    .catch((err) => res.status(404).json("Something went wrong."));
};

const userAuth = (db) => (req, res) => {
  db.select("mobile", "password", "username")
    .from("usercrediantials")
    .where("username", "=", req.body.user)
    .then((data) => {
      // console.log(data)
      db.select(
        "ui.firstname",
        "ui.lastname",
        "ui.address",
        "ui.location",
        "ui.image",
        "ui.username",
        "ucr.mobile"
      )
        .from("userinfo as ui")
        .leftJoin("usercrediantials as ucr", function () {
          this.on("ucr.username", "ui.username");
        })
        .where("ui.username", data[0].username)
        .then((respo) => res.json(respo))
        .catch((err) => res.status(400).json("Invalid user"));
    })
    .catch((err) => res.status(400).json("Invalid user"));
};

module.exports = {
  signinhandler: signinhandler,
  NumberValidateHandler: NumberValidateHandler,
  userAuth: userAuth,
};
