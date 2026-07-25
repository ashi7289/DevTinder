const express = require("express");
const app = express();
const connectDB = require("./src/config/database");
const User = require("./src/models/user");

const cookieParser = require("cookie-parser");

const router = require("./src/routes");

app.use(cookieParser());
app.use(express.json());

app.use("/", router);

connectDB()
  .then(() => {
    console.log("Database Connection Established..");
    app.listen(3000, () => {
      console.log("Connected");
    });
  })
  .catch((err) => {
    console.log("Database cannot be Connected..");
    console.error(err.message);
  });
