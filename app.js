require("dotenv").config();
require("./src/utils/cronjob");
const express = require("express");
const app = express();
const connectDB = require("./src/config/database");
const cookieParser = require("cookie-parser");
const router = require("./src/routes");
const cors = require("cors");
const http = require("http");
const { getCorsOptions } = require("./src/config/security");
const initializeSocket = require("./src/utils/socket");
app.use(cookieParser());
app.use(express.json());
app.use(cors(getCorsOptions()));
app.use("/", router);

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
    });
  })
  .catch((err) => {
  });
