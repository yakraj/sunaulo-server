const CreateTrx = (db) => (req, res) => {
  const { text } = req.body;

  db.transaction((trx) =>
    trx
      .insert({
        text: text,
      })
      .into("trxarchive")
      .returning("text")
      .then((TextVal) => {
        console.log(TextVal[0]);

        if (TextVal[0] === "yakraj") {
          return trx("trxfrst")
            .insert({
              text: TextVal[0],
            })
            .then((response) => res.json(response))
            .catch((err) => res.status(404).end());
        } else if (TextVal[0] === "kale") {
          return trx("trxscnd")
            .insert({
              text: TextVal[0],
            })
            .then((response) => res.json(response))
            .catch((err) => res.status(404).end());
        }
      })
  );
};

module.exports = {
  CreateTrx: CreateTrx,
};
