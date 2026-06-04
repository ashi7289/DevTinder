const mongoose = require("mongoose");

const validator = require("validator");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 50,
    },
    lastName: {
      type: String,
    },
    emailId: {
      required: true,
      type: String,
      lowercase: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email address" + value);
        }
      },
    },
    password: {
      required: true,
      type: String,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new error("Gender data is not valid");
        }
      },
    },
    age: {
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email address" + value);
        }
      },
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "others"].includes(value)) {
          throw new error("Gender data is not valid");
        }
      },
    },
    photoUrl: {
      type: String,
      default:
        "https://thumbs.dreamstime.com/b/user-profile-avatar-icon-default-account-placeholder-flat-gray-circular-avatar-silhouette-generic-user-profile-placeholder-399165083.jpg?w=768",

      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid Photo URL" + value);
        }
      },
    },
    about: {
      type: String,
      default: "This is a default about of the user!",
    },
    skills: {
      type: [String],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
