const validator = require("validator");
const { RegExpMatcher, englishDataset, englishRecommendedTransformers, pattern } = require("obscenity");

// Library list of sexual/abusive words (also catches "s3x") + a few extras
const extraWords = ["nude", "naked", "nsfw", "onlyfans"];
const dataset = extraWords.reduce((d, w) => d.addPhrase((p) => p.addPattern(pattern`|${w}`)), englishDataset);
const profanity = new RegExpMatcher({ ...dataset.build(), ...englishRecommendedTransformers });

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

const validateSkills = (skills) => {
  if (!Array.isArray(skills) || skills.length > 20) throw new Error("Add at most 20 skills");
  for (const skill of skills) {
    if (!/^(?=.*[a-z])[\w+#.\-/& ]{1,30}$/i.test(skill)) throw new Error(`"${skill}" is not a valid skill`);
    const joined = skill.replace(/\b(\w)\W+(?=\w\b)/g, "$1"); // "f u c k" -> "fuck"
    if (profanity.hasMatch(skill) || profanity.hasMatch(joined)) throw new Error(`"${skill}" is not allowed`);
  }
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
    // emailId is the login ID, so it can't be edited
    "gender",
    "age",
    "about",
    "skills",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field),
  );
  if (!isEditAllowed) return false;

  validateAge(req.body.age);
  if (req.body.skills !== undefined) validateSkills(req.body.skills);
  return true;
};
module.exports = {
  validationSignUpData,
  validationEditProfileData,
  validatePassword,
  validateAge,
  validateSkills,
};
