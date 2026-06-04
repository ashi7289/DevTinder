const express = require("express");
const app = express();
const connectDB = require("./src/config/database");
const User = require("./src/models/user");
const { validationSignUpData } = require("./src/utils/validation");
const bcrypt = require("bcrypt");
const jwt =require("jsonwebtoken")
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    validationSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();

    res.send("User added Successfully");
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});
app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("Invalid Creds");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const token = await jwt.sign({ _id: user._id }, "DEV@TINDER$790");
      console.log(token);
      res.cookie("token", token);
      res.send("Login Succesfull!!!");
    } else {
      throw new Error("Invalid Creds");
    }
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

app.get("/profile", async (req, res) => {
  res.send("REading Cookie");
});
app.get("/user", async (req, res) => {
  const firstName = req.body.firstName;

  try {
    const user = await User.find({ firstName: firstName });
    if (user.length === 0) {
      res.status(404).send("User Not Found");
    } else {
      res.send(user);
    }
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

app.get("/feed", async (req, res) => {
  const firstName = req.body.firstName;

  try {
    const user = await User.find({ firstName: firstName });

    res.send(user);
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;

  try {
    const user = await User.findByIdAndDelete(userId);

    res.send("User Deleted Successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

app.delete("/users", async (_req, res) => {
  try {
    await User.deleteMany({});
    res.send("All Users Deleted Successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

app.patch("/user/:userId", async (req, res) => {
  const body = req.body;

  const id = req.params.userId;

  try {
    const ALLOWED_UPDATES = [
      "userId",
      "photoUrl",
      "about",
      "gender",
      "skills",
      "age",
    ];

    const isUpdatedAllowed = Object.keys(body).every((k) =>
      ALLOWED_UPDATES.includes(k),
    );

    if (!isUpdatedAllowed) {
      throw new Error("Update not allowed");
    }

    if (body?.skills?.length > 10) {
      throw new Error("Skills cannot be more then 10");
    }
    await User.findByIdAndUpdate({ _id: id }, body, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send("User Updated Successfully");
  } catch (err) {
    res.status(400).send("Update Failed" + err.message);
  }
});

connectDB()
  .then(() => {
    console.log("Database Connection Established..");
    app.listen(3000, () => {
      console.log("Connected");
    });
  })
  .catch((err) => {
    console.log("Database cannot be Connected..");
    console.error(err.message);
  });
