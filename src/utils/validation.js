const validator = require("validator");

const PASSWORD_RULES =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol";

const validatePassword = (password) => {
  if (typeof password !== "string" || !validator.isStrongPassword(password)) {
    throw new Error(PASSWORD_RULES);
  }
};

// Empty is allowed (age is optional); otherwise a whole number from 18 to 100
const validateAge = (age) => {
  if (age === undefined || age === null || age === "") return;
  const value = Number(age);
  if (!Number.isInteger(value)) throw new Error("Age must be a whole number");
  if (value < 18) throw new Error("You must be at least 18 years old");
  if (value > 100) throw new Error("Age must be 100 or less");
};

const validationSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Name is not valid");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  }
  validatePassword(password);
};
const validationEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "emailId",
    "gender",
    "age",
    "about",
    "skills",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field),
  );
  if (isEditAllowed) validateAge(req.body.age);
  return isEditAllowed;
};
module.exports = {
  validationSignUpData,
  validationEditProfileData,
  validatePassword,
  validateAge,
};
