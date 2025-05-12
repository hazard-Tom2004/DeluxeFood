import express from "express"
import { userRegister, userLogin, changeUserPassword, userRequestReset, verifyUserResetToken, userResetPassword, changeUsername, userLogout, vendorRegister, vendorLogin, changeVendorPassword, vendorRequestReset, verifyVendorResetToken, vendorResetPassword, vendorLogout } from "../controllers/authController.js";
import { createFood, deleteFood, getFoodById, updateFood, searchFoodByName, searchFoodByCategory, filterFoodsByPrice, getAllFoods } from "../controllers/foodController.js";
import { searchVendorByCompanyName, getVendorById, getAllVendors } from "../controllers/vendorController.js" 
import { verifyUser, verifyVendor, verifyToken } from "../middlewares/Auth.js";
import upload from "../middlewares/multer.js"
const router = express.Router();

//user auth
router.post("/register-user", userRegister);
router.post("/login-user", userLogin);
router.post("/reset-user", userRequestReset);
router.get("/verify-user-reset-token", verifyUserResetToken);
router.post("/update-password-user", userResetPassword)
router.post("/logout-user", userLogout);
router.put("/change-username", verifyUser, changeUsername);
router.put("/change-password-user", verifyToken, changeUserPassword)
//vendor auth
router.post("/register-vendor", upload.single("picture"), vendorRegister);
router.post("/login-vendor", vendorLogin);
router.post("/reset-vendor", vendorRequestReset);
router.get("/verify-vendor-reset-token", verifyVendorResetToken);
router.post("/update-password-vendor", vendorResetPassword)
router.post("/logout-vendor", vendorLogout);
router.put("/change-password-vendor", verifyToken, changeVendorPassword);
//food accessing
router.post("/create-food", verifyVendor, upload.single("picture"), createFood);
router.get("/get-food/:id", getFoodById);
router.put("/edit-food/:id", verifyVendor, upload.single("picture"), updateFood);
router.delete("/delete-food/:id", verifyVendor, deleteFood);
router.get("/search-food-by-name", searchFoodByName);
router.get("/search-food-by-category", searchFoodByCategory);
router.get("/filter-by-price", filterFoodsByPrice);
router.get("/get-all-foods", getAllFoods)
//getting vendors
router.get("/search-vendor-by-company-name", searchVendorByCompanyName);
router.get("/get-vendor/:id", getVendorById)
router.get("/get-all-vendor", getAllVendors);


// module.exports = router
export default router;