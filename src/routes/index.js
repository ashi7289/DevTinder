
const express = require("express");
const router = express.Router();

const { authRouter } = require("./auth");
const { profileRouter } = require("./profile");
const { requestRouter } = require("./request");
const userRouter = require("./user");
const { dropdownRouter } = require("./dropdown");
const chatRouter = require("./chat");

router.use("/", authRouter);
router.use("/", profileRouter);
router.use("/", requestRouter);
router.use("/", userRouter);
router.use("/", dropdownRouter);
router.use("/", chatRouter);

module.exports = router;
