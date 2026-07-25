
const express = require("express");
const router = express.Router();

const { authRouter } = require("./auth");
const { profileRouter } = require("./profile");
const { requestRouter } = require("./request");
const userRouter = require("./user");

router.use("/", authRouter);
router.use("/", profileRouter);
router.use("/", requestRouter);
router.use("/", userRouter);

module.exports = router;
