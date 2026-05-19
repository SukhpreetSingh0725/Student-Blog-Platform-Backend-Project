const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const deleteFile = (filename) => {
  if (!filename || filename === "default-avatar.png") return;

  const filePath = path.join(__dirname, "../uploads", filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting file:", err);
    else console.log("Deleted file:", filename);
  });
};
module.exports = { upload,deleteFile };