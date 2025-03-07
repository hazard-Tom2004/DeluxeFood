import express from "express"
import { userRegister, userLogin, userRequestReset, userResetPassword, userLogout, vendorRegister, vendorLogin, vendorRequestReset, vendorResetPassword, vendorLogout } from "../controllers/authController.js";
import upload from "../middlewares/multer.js"
const router = express.Router();

router.post("/register-user", userRegister);
router.post("/login-user", userLogin);
router.post("/reset-user", userRequestReset);
router.post("/update-password-user", userResetPassword)
router.post("/logout-user", userLogout);
router.post("/register-vendor", upload.single("picture"), vendorRegister);
router.post("/login-vendor", vendorLogin);
router.post("/reset-vendor", vendorRequestReset);
router.post("/update-password-vendor", vendorResetPassword)
router.post("/logout-vendor", vendorLogout);


// module.exports = router
export default router;