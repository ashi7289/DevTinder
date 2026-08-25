const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Others", value: "others" },
];

const GENDER = GENDER_OPTIONS.map((option) => option.value);

module.exports = {
  GENDER,
  GENDER_OPTIONS,
};
