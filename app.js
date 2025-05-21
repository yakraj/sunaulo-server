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
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sunaulo-uploads",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
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

// const getads = require("./controllers/getads");
const creatspost = require("./controllers/newpost");
// const filterKeys = require("./controllers/getfilterkeys");
// const filteredAds = require("./controllers/filteredAds");
// const adsfilterable = require("./controllers/getfilterablevalues");
const searchCache = require("./controllers/searchCache");
const searchautosuggest = require("./controllers/searchautosuggest");
const subcatogerySuggestion = require("./controllers/subcatogerySuggestion");
const MessagePool = require("./controllers/chatting.longpoll");
// const Uiads = require("./controllers/getadsforuserui");
const regUser = require("./controllers/register.user");
const Signinuser = require("./controllers/signin.user");
const UpdateuserInfo = require("./controllers/update.userinfo");
const TrxTry = require("./controllers/trxtry");
const UserAds = require("./controllers/user.ads");
const ProductLike = require("./controllers/product.like");
const userFavourites = require("./controllers/user.favourites");
const ProductInfo = require("./controllers/product.views.profile");
// const CreateChat = require("./controllers/create.chat");
// const chatsDel = require("./controllers/delete.chatarchive");
const ImageUpload = require("./controllers/upload.image");
const googleApi = require("./controllers/Google.maps");
const Otpservice = require("./controllers/otp.verifier");
const chatting = require("./controllers/chatting");
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
// here it is
app.post(
  "/updateavatar",
  UpdateImage.single("fileData"),
  UpdateuserInfo.updateavatar(db, uniqid, bcrypt)
);
app.post("/update/user/name", UpdateuserInfo.updateName(db, uniqid, bcrypt));
app.post("/update/user/location", UpdateuserInfo.updateLocation(db));

//register and signin user handler..... it will handle all for user data.
app.post("/registeruser", regUser.registerhandler(db, uniqid, bcrypt));
app.post("/signinuser", Signinuser.signinhandler(db, bcrypt));
app.post("/reqresetpassotp", Signinuser.requestResetOtp(db, bcrypt));
app.post("/reqresendotp", Signinuser.resendResetOtp(db, bcrypt));
app.post("/verifyotp", Signinuser.verifyResetOtp());
app.post("/resetpassword", Signinuser.resetPassword(db, bcrypt));

// user ads
app.post("/user/ads", UserAds.UserAdsHandler(db));
app.post("/get/product/profile", ProductInfo.Productprofilehandler(db));
app.post("/get/product/information", ProductInfo.ProductInfohandler(db));
app.post(
  "/sunaulo/creating/new_post/new",
  creatspost.createNewPostHandler(db, uniqid, st)
);
app.post("/cache/add_search_history", searchCache.searchCacheHandler(db));
app.post(
  "/search/keywords/autoSuggest",
  searchautosuggest.autoSuggestHandler(db)
);
app.post(
  "/search/subcatoger/autoSuggest",
  subcatogerySuggestion.subcatogerySuggestionHandler(db)
);
app.post("/chatpool", MessagePool.HandlePoll(db));
app.post("/createchat", MessagePool.makeMessage(db));
app.post("/getproductchat", MessagePool.getChats(db));
app.post("/transtry", TrxTry.CreateTrx(db));
app.post("/subcatogery", subcatogerySuggestion.SubCatogeryHandler(db));
app.post("/delete/userad", creatspost.DeletePostHandler(db));
app.post("/autocomplete", googleApi.MapHandler(db, client));
app.post("/placelatlong", googleApi.PlaceLatLong(db, client));
app.post("/locationplacename", googleApi.LocationDetails(db, client));
app.post("/placeuser", googleApi.AutocompleteDtails(db, client));
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

// Chat routes
app.post("/chat/send", chatting(db).sendMessage);
app.post("/chat/messages", chatting(db).getMessages);
app.post("/chat/mark-read", chatting(db).markAsRead);
app.post("/chat/edit", chatting(db).editMessage);
app.post("/chat/delete", chatting(db).deleteMessage);

app.listen(process.env.PORT || 5001, () => {
  console.log(`app is running on port ${process.env.PORT}`);
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sunaulo-uploads",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

const cloudinaryUpload = multer({ storage: cloudinaryStorage });

// Post routes
app.post(
  "/post/create",
  cloudinaryUpload.array("images", 12),
  creatspost.createPostHandler(db, uniqid, st)
);
app.post("/post/delete", creatspost.deletePostHandler(db));
