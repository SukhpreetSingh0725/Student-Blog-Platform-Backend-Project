const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  fullName: {type: String, required: true, trim: true},
  email: { type: String, required: true, lowercase: true},
  message: { type: String, required: true},
  date: { type: Date, default: Date.now
  }
},{ collection: 'messages' });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;