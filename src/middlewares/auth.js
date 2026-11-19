const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please Login!");
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Expired, tampered or malformed token: the client must log in again
      return res.status(401).send("Session expired, please login again");
    }

    const user = await User.findById(decodedObj._id);
    if (!user) {
      return res.status(401).send("User not found, please login again");
    }

    req.user = user;
    next();
  } catch (err) {
    // Anything else (e.g. database down) is our fault, not the client's
    res.status(500).send("ERROR: " + err.message);
  }
};

module.exports = { userAuth };
