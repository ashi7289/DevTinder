const express = require("express");

const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { validationEditProfileData } = require("../utils/validation");
const deleteUserCompletely = require("../utils/deleteUser");
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validationEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }
    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();
    res.json({
      message: `${loggedInUser?.firstName}, Profile Updated Successfully`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});
// Permanently delete the logged-in user's account (password required)
profileRouter.delete("/profile/delete", userAuth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    if (!password || !(await user.validatePasssword(password))) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    await deleteUserCompletely(user._id);

    // Log them out
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "ERROR: " + err.message });
  }
});

module.exports = {
  profileRouter,
};
