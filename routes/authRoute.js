import express from "express"
import { userRegister, userLogin, userRequestReset, userResetPassword, userLogout, vendorRegister, vendorLogin, vendorRequestReset, vendorResetPassword, vendorLogout } from "../controllers/authController.js";
import { createFood, deleteFood, getFoodById, updateFood, searchFoodByName, searchFoodByCategory } from "../controllers/foodController.js";
import { verifyVendor } from "../middlewares/vendorAuth.js";
import upload from "../middlewares/multer.js"
const router = express.Router();

//user auth
router.post("/register-user", userRegister);
router.post("/login-user", userLogin);
router.post("/reset-user", userRequestReset);
router.post("/update-password-user", userResetPassword)
router.post("/logout-user", userLogout);
//vendor auth
router.post("/register-vendor", upload.single("picture"), vendorRegister);
router.post("/login-vendor", vendorLogin);
router.post("/reset-vendor", vendorRequestReset);
router.post("/update-password-vendor", vendorResetPassword)
router.post("/logout-vendor", vendorLogout);
//food accessing
router.post("/create-food", verifyVendor, upload.single("picture"), createFood);
router.get("/get-food/:id", getFoodById);
router.put("/edit-food/:id", verifyVendor, upload.single("picture"), updateFood);
router.delete("/delete-food/:id", verifyVendor, deleteFood);
router.get("/get-food-by-name", searchFoodByName);
router.get("/get-food-by-category", searchFoodByCategory);


// module.exports = router
export default router;