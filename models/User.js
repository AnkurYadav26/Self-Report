const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectName: String,
  video: { type: Boolean, default: false },
  revision: { type: Boolean, default: false },
  test: { type: Boolean, default: false }
});

const recordSchema = new mongoose.Schema({
  date: String,
  subjects: [subjectSchema]
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  records: [recordSchema]
});

module.exports = mongoose.model("User", userSchema);
