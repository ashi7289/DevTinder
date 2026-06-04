const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://devTinder:wPnFkOygh4vjpZpU@devtinder.5gliufz.mongodb.net/",
  );
};

module.exports = connectDB;
