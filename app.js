require("dotenv").config();

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const consign = require("consign");
var multer = require("multer");
const bcrypt = require("bcrypt-nodejs");
const uniqid = require("uniqid");
const { Client } = require("@googlemaps/google-maps-services-js");
const knexPostgis = require("knex-postgis");
const multerGoogleStorage = require("multer-google-storage");
const db = require("./config/db");
// var unirest = require("unirest");

// const socket = require('./controllers/sockettrial')

const UpdateImage = multer({
  storage: multerGoogleStorage.storageEngine({
    autoRetry: true,
    bucket: "sunauloo.com",
    projectId: "sunaulo-database",
    keyFilename: "./sunaulo-database-25292fa50538.json",
    filename: function (req, file, cb) {
      cb(null, file.originalname + "-" + Date.now() + ".png");
      // let extArray = file.mimetype.split("/");
      // let extension = extArray[extArray.length - 1];
      // cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});
const ProductThumbnail = multer({
  storage: multerGoogleStorage.storageEngine({
    autoRetry: true,
    bucket: "post-thumbnail",
    projectId: "sunaulo-database",
    keyFilename: "./sunaulo-database-25292fa50538.json",
    filename: function (req, file, cb) {
      cb(null, file.originalname + "-" + Date.now() + ".png");
      // let extArray = file.mimetype.split("/");
      // let extension = extArray[extArray.length - 1];
      // cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

const ProductImages = multer({
  storage: multerGoogleStorage.storageEngine({
    autoRetry: true,
    bucket: "sunaulo-uploads",
    projectId: "sunaulo-database",
    keyFilename: "./sunaulo-database-25292fa50538.json",
    filename: function (req, file, cb) {
      cb(null, file.originalname + "-" + Date.now() + ".png");
      // let extArray = file.mimetype.split("/");
      // let extension = extArray[extArray.length - 1];
      // cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + "-" + Date.now() + ".png");
    // let extArray = file.mimetype.split("/");
    // let extension = extArray[extArray.length - 1];
    // cb(null, Date.now() + "-" + file.originalname);
  },
});

const regstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/useravatar/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + "-" + Date.now() + ".png");
    // let extArray = file.mimetype.split("/");
    // let extension = extArray[extArray.length - 1];
    // cb(
    //   null,
    //   Date.now() + "-" + file.originalname + path.extname(file.originalname)
    // );
    // cb(null, Date.now() + ".jpg");
  },
});
const thumbstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/product-thumbnail/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + "-" + Date.now() + ".png");
    // let extArray = file.mimetype.split("/");
    // let extension = extArray[extArray.length - 1];
    // cb(
    //   null,
    //   Date.now() + "-" + file.originalname + path.extname(file.originalname)
    // );
    // cb(null, Date.now() + ".jpg");
  },
});
// hello there
var upload = multer({ storage: storage });
var regupload = multer({ storage: regstorage });
var thumbupload = multer({ storage: thumbstorage });
// var upload = multer({ dest: 'uploads/' });

// const db = knex({
//   client: "pg",
//   connection: {
//     host: "45.115.217.93",
//     user: "sunaulo",
//     password: "D@yl!g$t145%@",
//     database: "sunaulo",
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 5000,
//   },
// });

// const db = knex({
//   client: "pg",
//   connection: {
//     host: "45.115.217.98",
//     user: "webadmin",
//     password: "AFInbo37717",
//     database: "postgres",
//   },
// });

// const KNEX_CON = {
//   host: "/cloudsql/sunaulo-database:asia-south1:sunaulo-database",
//   user: "postgres",
//   password: "daylightsunaulo289@",
//   database: "postgres",
// };
// const db = knex({
//   client: "pg",
//   connection: KNEX_CON,
// });

// const st = knexPostgis(db);
const st = knexPostgis(db);

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.resolve("./public")));
const client = new Client({});

const getads = require("./controllers/getads");
const creatspost = require("./controllers/newpost");
const filterKeys = require("./controllers/getfilterkeys");
const filteredAds = require("./controllers/filteredAds");
const adsfilterable = require("./controllers/getfilterablevalues");
const searchCache = require("./controllers/searchCache");
const searchautosuggest = require("./controllers/searchautosuggest");
const subcatogerySuggestion = require("./controllers/subcatogerySuggestion");
const MessagePool = require("./controllers/chatting.longpoll");
const Uiads = require("./controllers/getadsforuserui");
const regUser = require("./controllers/register.user");
const Signinuser = require("./controllers/signin.user");
const UpdateuserInfo = require("./controllers/update.userinfo");
const TrxTry = require("./controllers/trxtry");
const UserAds = require("./controllers/user.ads");
const ProductLike = require("./controllers/product.like");
const userFavourites = require("./controllers/user.favourites");
const ProductInfo = require("./controllers/product.views.profile");
const CreateChat = require("./controllers/create.chat");
const chatsDel = require("./controllers/delete.chatarchive");
const ImageUpload = require("./controllers/upload.image");
const googleApi = require("./controllers/Google.maps");
const Otpservice = require("./controllers/otp.verifier");
// // cleaning unused keys in object
//   function clean(obj) {
//   for (var propName in obj) {
//     if (obj[propName] === null || obj[propName] === undefined || obj[propName] === "") {
//       delete obj[propName];
//     }
//   }
//   return obj
// }

// images.forEach((element, i) => {
//   const newFile = {
//     uri: element,
//     type: "image/jpg",
//   };
//   data.append("fileData", newFile);
// });
app.get("/", async (req, res) => {
  try {
    // Try a simple query to test the connection
    await db.raw("SELECT 1+1 AS result");
    res.json({ status: "ok", message: "Database connection successful!" });
  } catch (err) {
    console.error("Database connection error:", err); // Print error to console
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: err.message,
    });
  }
});

app.get("/otp", (req, res) => {
  // var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");
  // req.query({
  //   authorization:
  //     "KLF32bSuRJ9eBpwsZdQ4fWaGV6HhDtog7CTY5UjlEiX0mIyvnc1k9HQbtMX6zpi4cIdgaqBNxG7j5sYm",
  //   variables_values: "5599",
  //   route: "otp",
  //   numbers: "7709543082,7709522405",
  // });
  // req.headers({
  //   "cache-control": "no-cache",
  // });
  // req.end(function (ress) {
  //   if (res.error) throw new Error(res.error);
  //   res.json(ress);
  //   console.log(ress.body);
  // });
});

app.get(`/data/:id`, (req, res) => {
  db.select("*")
    .from(req.params.id)
    .then((response) => res.json(response))
    .catch((err) => res.status(500).end());
});

app.get("/data", (req, res) => {
  db.select("*")
    .from("test")
    .then((ress) => res.json(ress))
    .catch((err) => res.status(500).end());
});

// here it is
app.post(
  "/app/ad/thumbnail",
  ProductThumbnail.single("fileData"),
  (req, res) => {
    console.log("request is reached to me");
    res.json(req.file.filename).catch((err) => res.status(500).end());
  }
);
// here it is
app.post(
  "/uploadimage",
  ProductImages.array("fileData", 12),
  ImageUpload.uploadImageHandler(db)
);
// here it is
app.post(
  "/registeruser",
  UpdateImage.single("fileData"),
  regUser.registerhandler(db, uniqid, bcrypt)
);
// app.post(
//   "/updateavatar",
//   regupload.single("fileData"),
//   UpdateuserInfo.updateavatar(db, uniqid, bcrypt)
// );
// here it is
app.post(
  "/updateavatar",
  UpdateImage.single("fileData"),
  UpdateuserInfo.updateavatar(db, uniqid, bcrypt)
);
app.post("/userAuth", Signinuser.userAuth(db));
app.post("/update/user/name", UpdateuserInfo.updateName(db, uniqid, bcrypt));
app.post(
  "/update/user/mobile",
  UpdateuserInfo.updateMobile(db, uniqid, bcrypt)
);
app.post("/update/user/location", UpdateuserInfo.updateLocation(db));
app.post("/wiregisteruser", regUser.registerhandler(db, uniqid, bcrypt));
app.post("/signinuser", Signinuser.signinhandler(db, bcrypt));
app.post("/user/ads", UserAds.UserAdsHandler(db));
app.post("/get/user/favourites", userFavourites.getFavouritesHandler(db));
app.post("/update/user/favourites", userFavourites.updateFavouritesHandler(db));
app.post("/getads/user/favourites", userFavourites.getFavouriteadsHandler(db));
app.post("/product/likes", ProductLike.ProductLikeHandler(db));
app.post("/get/product/likes", ProductLike.UserGetlikehandler(db));
app.post("/get/only/likes", ProductLike.ProductOnlyLikeHandler(db));
app.post("/get/product/profile", ProductInfo.Productprofilehandler(db));
app.post("/get/product/information", ProductInfo.ProductInfohandler(db));
app.post("/create/chat", CreateChat.createChathandler(db, uniqid));
// app.post('/update/product/views', ProductInfo.ProductViwshandler(db))
app.post(
  "/sunaulo/creating/new_post/new",
  creatspost.createNewPostHandler(db, uniqid, st)
);
app.post("/search/get_ads", getads.getAdshandler(db, st));
app.post(
  "/get_filter/filterads_keys/find/filter",
  filterKeys.getFilterKeysHandler(db)
);
app.post(
  "/custom_ads/filter/get_filtered/ads",
  filteredAds.getFilteredAdsHandler(db)
);
app.post("/get/filterable/values", adsfilterable.filterableValuesHandler(db));
app.post("/cache/add_search_history", searchCache.searchCacheHandler(db));
app.post(
  "/search/keywords/autoSuggest",
  searchautosuggest.autoSuggestHandler(db)
);
app.post(
  "/search/subcatoger/autoSuggest",
  subcatogerySuggestion.subcatogerySuggestionHandler(db)
);
app.post("/chatdelete", chatsDel.deleteChatArchivehandler(db));
app.post("/chatpool", MessagePool.HandlePoll(db));
app.post("/createchat", MessagePool.makeMessage(db));
app.post("/getproductchat", MessagePool.getChats(db));
app.post("/getuiads", Uiads.getUiads(db, st));
app.post("/transtry", TrxTry.CreateTrx(db));
app.post("/chatdelete", chatsDel.deleteChatArchivehandler(db));
app.post("/subcatogery", subcatogerySuggestion.SubCatogeryHandler(db));
app.post("/user/sunaulo/chatt/getchats", getads.GetChatsHandler(db));
app.post("/chatuser", CreateChat.Chatuser(db));
app.post("/numberexistanceverify", Signinuser.NumberValidateHandler(db));
app.post("/delete/userad", creatspost.DeletePostHandler(db));
app.post("/autocomplete", googleApi.MapHandler(db, client));
app.post("/placelatlong", googleApi.PlaceLatLong(db, client));
app.post("/locationplacename", googleApi.LocationDetails(db, client));
app.post("/placeuser", googleApi.AutocompleteDtails(db, client));
app.post("/otp/send", Otpservice.otpsender(axios));
app.post("/otp/verify", Otpservice.otpVerification());
app.post("/web/product/info", (req, res) => {
  db.select("address", "price", "title")
    .from("archive")
    .where("adid", req.body.adid)
    .then((response) => res.json(response[0]))
    .catch((err) => res.end());
});
app.post("/geomakeloc", googleApi.CreateLocation(db, st));

app.post("/getnearby", googleApi.Nearby(db, st));
app.post("/modify-pass", UpdateuserInfo.MdPass(db, bcrypt));

app.listen(process.env.PORT || 5001, () => {
  console.log(`app is running on port ${process.env.PORT}`);
});
