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

const st = knexPostgis(db);
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.resolve("./public")));
const client = new Client({});

//it handles posts
const { b2Config, uploadMiddleware } = require('./controllers/b2_upload'); // Import B2 client and Multer setup
const { createPostHandler, deletePostHandler } = require('./controllers/newpost'); // Import post handlers

//for user autocomplete search cache and autocomplete it will
const searchHelp = require("./controllers/searchCache");
//Special user register and user sign and reset password handlers
const regUser = require("./controllers/register.user");
const Signinuser = require("./controllers/signin.user");
//update user crediantials
const UpdateuserInfo = require("./controllers/update.userinfo");
//google api related to the autocomplete and work with lat long
const googleApi = require("./controllers/Google.maps");
//chatting handler everything.
const chatting = require("./controllers/chatting");

app.get("/", async (req, res) => {
  res.json("server is running fine");
});

// here it is
app.post("/update/user/name", UpdateuserInfo.updateName(db, uniqid, bcrypt));
app.post("/update/user/location", UpdateuserInfo.updateLocation(db));
// app.post("/update/user/avatar", UpdateuserInfo.updateAvatar(db));
//register and signin user handler..... it will handle all for user data.
app.post("/registeruser", regUser.registerhandler(db, uniqid, bcrypt));
app.post("/signinuser", Signinuser.signinhandler(db, bcrypt));
app.post("/reqresetpassotp", Signinuser.requestResetOtp(db, bcrypt));
app.post("/reqresendotp", Signinuser.resendResetOtp(db, bcrypt));
app.post("/verifyotp", Signinuser.verifyResetOtp());
app.post("/resetpassword", Signinuser.resetPassword(db, bcrypt));

// create a and delete post




app.post(
  '/create-post',
  uploadMiddleware.array('images', 5), // 'images' is the expected field name from client's form data
  // Pass necessary dependencies to the handler, including the b2S3Client from b2Config
  createPostHandler(db, uniqid, st, b2Config.b2S3Client)
);

app.post(
  '/delete-post',
  // Pass necessary dependencies to the handler, including the b2S3Client from b2Config
  deletePostHandler(db, b2Config.b2S3Client)
);
//caching search history and autocomplete
// please activate it later ----important
// app.post("/cache/add_search_history", searchCache.searchCacheHandler(db));
// app.post(
//   "/search/keywords/autoSuggest",
//   searchautosuggest.autoSuggestHandler(db)
// );

//google map autocomplete address and transcode the geolocation
app.post("/autocomplete", googleApi.MapHandler(db, client));
app.post("/placelatlong", googleApi.PlaceLatLong(db, client));
app.post("/locationplacename", googleApi.LocationDetails(db, client));
app.post("/placeuser", googleApi.AutocompleteDtails(db, client));
// Chat routes
app.post("/chat/send", chatting(db).sendMessage);
app.post("/chat/messages", chatting(db).getMessages);
app.post("/chat/mark-read", chatting(db).markAsRead);
app.post("/chat/edit", chatting(db).editMessage);
app.post("/chat/delete", chatting(db).deleteMessage);

app.listen(process.env.PORT || 5000, () => {
  console.log(`app is running on port ${process.env.PORT}`);
});

// Configure Cloudinary storage

// Post routes
