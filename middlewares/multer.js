import multer from "multer";

//Only when one needs to store paths locally
// import path from "path"; 
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// console.log(__dirname);

// configure Multer storage (store in memory)
const storage = multer.memoryStorage();


const fileFilter = (req, file, callback) => {
  // Allow only images
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
