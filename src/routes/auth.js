const express = require("express");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const authRouter = express.Router();
const { validationSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const { setAuthCookie, clearAuthCookie } = require("../config/security");

authRouter.post("/signup", async (req, res) => {
  try {
    validationSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;

    // Schema stores emailId trimmed + lowercased, so compare the same way
    const existingUser = await User.findOne({
      emailId: emailId.trim().toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).send("This email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    const savedUser = await user.save();
     const token = await savedUser.getJWT();
      setAuthCookie(res, token);
    res.send(savedUser);
  } catch (err) {
    // Unique index violation (e.g. two signups with the same email at once)
    if (err.code === 11000) {
      return res.status(409).send("This email already exists");
    }
    res.status(400).send("ERROR : " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("Invalid Creds");
    }

    const isPasswordValid = await user.validatePasssword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();
      setAuthCookie(res, token);
      res.send(user);
    } else {
      throw new Error("Invalid Creds");
    }
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  clearAuthCookie(res);
  res.send("Logout Successful!!");
});

module.exports = {
  authRouter,
};
