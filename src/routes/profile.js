const express = require("express");

const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { validationEditProfileData } = require("../utils/validation");
const deleteUserCompletely = require("../utils/deleteUser");
const multer = require("multer");
const {
  uploadProfilePhoto,
  deleteProfilePhoto,
  ALLOWED_PHOTO_TYPES,
} = require("../utils/s3Client");

// Keep the file in memory (it goes straight to S3), max 2 MB, images only
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_PHOTO_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed"));
  },
}).single("photo");

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
// Upload a new profile photo from the device (form field name: "photo")
profileRouter.post("/profile/photo", userAuth, (req, res) => {
  photoUpload(req, res, async (uploadErr) => {
    try {
      if (uploadErr) {
        const message =
          uploadErr.code === "LIMIT_FILE_SIZE"
            ? "Image must be smaller than 2 MB"
            : uploadErr.message;
        return res.status(400).json({ message });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Please choose an image" });
      }

      const user = req.user;
      const oldPhotoUrl = user.photoUrl;

      user.photoUrl = await uploadProfilePhoto(user._id, req.file);
      await user.save();

      // Remove the previous upload so old photos don't pile up in S3
      deleteProfilePhoto(oldPhotoUrl).catch(() => {});

      res.json({ message: "Photo updated", data: user });
    } catch (err) {
      res.status(400).json({ message: "ERROR: " + err.message });
    }
  });
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
    deleteProfilePhoto(user.photoUrl).catch(() => {});

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
