const mongoose = require("mongoose");

const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { GENDER } = require("../constants/enums");

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
    // Stored as a bcrypt hash, so strength is checked on the plain password
    // before hashing (see utils/validation.js), not here
    password: {
      required: true,
      type: String,
    },
    age: {
      type: Number,
      min: [18, "You must be at least 18 years old"],
      max: [100, "Age must be 100 or less"],
      validate: {
        validator: Number.isInteger,
        message: "Age must be a whole number",
      },
    },
    gender: {
      type: String,
      validate(value) {
        if (!GENDER.includes(value)) {
          throw new Error("Gender data is not valid");
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

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};
userSchema.methods.validatePasssword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    passwordHash,
  );
  return isPasswordValid;
};
const User = mongoose.model("User", userSchema);
module.exports = User;
