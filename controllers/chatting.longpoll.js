var pollContent = [];
// var existingPool = pollContent.filter((x)=> Math.abs(new Date() - new Date(x.time)) > 5000)
const exstfinder = () => {
  return pollContent.filter(
    (x) => Math.abs(new Date() - new Date(x.time)) > 7000
  );
};

function LoopDeleter() {
  if (pollContent.length) {
    var deletefinder = exstfinder();
    // console.log("pollContent", pollContent);
    // console.log("deletefinder", deletefinder);
    for (let res of deletefinder) {
      for (let ret of res.Res) {
        ret.json("end");
      }
    }

    // pollContent=	pollContent.filter((f)=> f !== pollContent.find((x)=> Math.abs(new Date() - new Date(x.time)) > 5000))
  }
  // console.log('deleter loop is working',pollContent)
  deletefinder &&
    deletefinder.map((x) => (pollContent = pollContent.filter((f) => f !== x)));
  setTimeout(() => {
    LoopDeleter();
  }, 300000);
}
LoopDeleter();

function FilterClean(obj) {
  for (var propName in obj) {
    if (
      obj[propName] === null ||
      obj[propName] === undefined ||
      obj[propName] === ""
    ) {
      delete obj[propName];
    }
  }
  return obj;
}

const HandlePoll = (db) => (req, res) => {
  pollContent.push({ chatid: req.body.chatid, Res: [res], time: Date() });
  // console.log(pollContent)
};

const getChats = (db) => (req, res) => {
  const { chatid } = req.body;

  db.select("*")
    .from("chats")
    .where("chatid", chatid)
    .orderBy("id")
    .then((response) => {
      response.map((res, i) => (newData = FilterClean(response[i])));
      res.json([chatid, response]);
    })
    .catch((err) => res.status(500).end());
};

const EmitChat = (chatid, db) => {
  filterRes = pollContent.filter((x) => x.chatid === chatid);
  pollContent = pollContent.filter((x) => x.chatid !== chatid);
  // console.log(pollContent)
  console.log(filterRes);
  for (let res of filterRes) {
    for (let ret of res.Res)
      db.select("*")
        .from("chats")
        .where("chatid", chatid)
        .orderBy("id")
        .then((response) => {
          response.map((res, i) => (newData = FilterClean(response[i])));
          ret.json([chatid, response]);
        });
  }
};

const HandleMessage = (db, req, res) => {
  const { chatid, user, deleter, text, location, images } = req.body;
  db("chats")
    .insert({
      chatid: chatid,
      userfrom: user,
      deletest: deleter,
      text: text,
      location: location,
      images: images,
      date: new Date(),
    })
    .then((response) => response);
  EmitChat(chatid, db);
};

const makeMessage = (db) => (req, res) => {
  HandleMessage(db, req, res);
  res.json("created");
};

module.exports = {
  HandlePoll: HandlePoll,
  makeMessage: makeMessage,
  getChats: getChats,
};
