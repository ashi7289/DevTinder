const express = require("express");

const dropdownRouter = express.Router();
const { GENDER_OPTIONS } = require("../constants/enums");

dropdownRouter.get("/gender", (req, res) => {
  try {
    res.json({ data: GENDER_OPTIONS });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = {
  dropdownRouter,
};
