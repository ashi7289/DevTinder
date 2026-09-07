const express = require("express");
const app = express();
const connectDB = require("./src/config/database");
const cookieParser = require("cookie-parser");
const router = require("./src/routes");
const cors= require("cors")

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin:"http://localhost:5173",
  credentials: true
}))
app.use("/", router);

require("dotenv").config()

connectDB()
  .then(() => {
    console.log("Database Connection Established..");
    app.listen(process.env.PORT, () => {
      console.log("Connected");
    });
  })
  .catch((err) => {
    console.log("Database cannot be Connected..");
    console.error(err.message);
  });
