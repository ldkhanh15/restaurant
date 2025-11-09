import multer from "multer";

const upload = multer({
  dest: process.env.UPLOAD_DIR || "uploads/",
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || "5242880"), // 5MB default
  },
});

export default upload;
