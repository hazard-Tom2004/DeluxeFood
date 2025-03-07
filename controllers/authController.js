import User from "../models/userModel.js";
import Token from "../models/tokenModel.js";
import Vendor from "../models/vendorModel.js";
const { hashFn, comparePasswords, sendEmail } = utils;
import cloudinary from "../config/cloudinary.js"
import utils from "../utils/utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

//handling the user's authentication
export const userRegister = async (req, res) => {
  const { username, email, password, phone } = req.body;
  const hashedPassword = await hashFn(password);

  try {
    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .send({ success: false, message: "User already exists" });

    // Create user
    const user = new User({ username, email, password: hashedPassword, phone });
    await user.save();

    res.status(201).send({
      success: true,
      message: "User registered successfully",
      data: {
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({
        success: false,
        message: "Duplicate field error: " + JSON.stringify(error.keyValue),
      });
    }
    res.status(500).send({ success: false, message: "Server error", error });
  }
};

export const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    //ensuring all fields are required
    if (!email || !password)
      return res
        .status(400)
        .send({ success: false, message: "All fields required!" });

    //ensuring only registered user can login
    const user = await User.findOne({ email });
    console.log(email);
    // if (!user)

    //login process
    if (user) {
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // res.send({ token });
      const refresh_token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "24h",
        }
      );

      const storeRefreshToken = async (userId, refreshToken) => {
        await Token.create({ userId, token: refreshToken });
      };

      //To compare passwords
      const getPassword = await user.password;
      console.log("Passwords must match,", password, getPassword);
      if (await comparePasswords(password, getPassword)) {
        console.log("This is the user token", token);
        // console.log(mongoose.Schema.Types.ObjectId);
        await storeRefreshToken(Token._id, refresh_token);
        return res.status(200).send({
          success: true,
          message: "User logged in successfully",
          data: {
            username: user.username,
            email: user.email,
            token,
            refresh_token,
          },
        });
      } else {
        return res.status(400).send({
          success: false,
          message: "Incorrect credentials!",
        });
      }
    } else {
      return res.status(400).send({
        success: false,
        message: `user with (${email}) does not exist!`,
      });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error!", error });
    console.log(error);
  }
};

//delete logic
export const userLogout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    // Delete refresh token from DB
    await Token.findOneAndDelete({ token: refreshToken });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//forgot password logic
export const userRequestReset = async (req, res) => {
  const { email } = req.body;
  console.log("Request body", email);
  try {
    // ensure all fields are provided
    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }
    //get user from database with email
    const user = await User.findOne({ email });
    console.log("This is the user", user);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: `User with email (${email}) does not exists`,
      });
    }

    // Generate reset token and expiration
    const userResetToken = await crypto.randomBytes(32).toString("hex");
    console.log(userResetToken);
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user record with the token
    const id = user._id;
    const replace = {
      $set: {
        userResetToken: resetTokenExpiration,
      },
    };
    const updated = await Token.updateOne({ id, replace });

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${userResetToken}`;
    console.log("This is the user email", email);
    await sendEmail(
      email || "tom3525001@gmail.com",
      "Password Reset",
      `Click here to reset your password: ${resetLink}`
    );

    res.status(200).send({
      success: true,
      message: "Reset link sent to your email.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server error. An error occured",
      error,
    });
    // next(error)
    console.log(error);
  }
};

export const userResetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    // Find user by token
    const user = await User.findOne(token);
    if (!user || new Date(user.reset_token_expiration) < new Date())
      return res.status(400).send({
        success: false,
        message: "Invalid or expired token.",
      });

    //hash new password
    const hashedPassword = await hashFn(newPassword);

    // Update user's password and clear the token
    const id = User._id;
    const updatePassword = {
      $set: {
        password: hashedPassword,
      },
    };
    const updateToken = {
      reset_token: "",
      reset_token_expiration: "",
    };

    const updatedPassword = await User.updateOne(id, updatePassword);
    const updatedtoken = await Token.updateOne(id, updateToken);
    // await updated.save();

    res.status(200).send({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Server error.",
      error,
    });
  }
};

//handling the vendor authentication
export const vendorRegister = async (req, res) => {
  const { name, companyName, email, address, preference, password } = req.body;

  const hashedPassword = await hashFn(password);

  try {
    // Check if user exists
    const exists = await Vendor.findOne({ email });
    if (exists)
      return res
        .status(400)
        .send({ success: false, message: "Vendor already exists" });

    let imageUrl = "";
    if (req.file) {
      const fileBase64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(fileBase64, {
        folder: "vendors",
      });
      imageUrl = result.secure_url;
    }

    // Create vendor
    const vendor = new Vendor({
      name,
      companyName,
      email,
      picture: imageUrl,
      address,
      preference,
      password: hashedPassword,
    });
    await vendor.save();

    res.status(201).send({
      success: true,
      message: "Vendor registered successfully",
      data: {
        name: vendor.name,
        companyName: vendor.companyName,
        email: vendor.email,
        picture: vendor.picture,
        address: vendor.address,
        preference: vendor.preference,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(error)
      console.log(req.body)
      // console.log(Vendor.schema.paths);
      return res.status(400).send({
        success: false,
        message: "Duplicate field error: " + JSON.stringify(error.keyValue),
      });
    }
    res.status(500).send({ success: false, message: `Server error!, ${error.message}`, error });
    console.log(error.message);
  }
};

export const vendorLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    //ensuring all fields are required
    if (!email || !password)
      return res
        .status(400)
        .send({ success: false, message: "All fields required!" });

    //ensuring only registered user can login
    const vendor = await Vendor.findOne({ email });
    console.log(email);
    // if (!user)

    //login process
    if (vendor) {
      // Generate JWT token
      const token = jwt.sign(
        { id: vendor._id, username: vendor.username },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // res.send({ token });
      const refresh_token = jwt.sign(
        { id: vendor._id, username: vendor.username },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "24h",
        }
      );

      const storeRefreshToken = async (userId, refreshToken) => {
        await Token.create({ userId, token: refreshToken });
      };

      //To compare passwords
      const getPassword = await vendor.password;
      console.log("Passwords must match,", password, getPassword);
      if (await comparePasswords(password, getPassword)) {
        console.log("This is the vendor token", token);
        // console.log(mongoose.Schema.Types.ObjectId);
        await storeRefreshToken(Token._id, refresh_token);
        return res.status(200).send({
          success: true,
          message: "Vendor logged in successfully",
          data: {
            companyName: vendor.companyName,
            email: vendor.email,
            token,
            refresh_token,
          },
        });
      } else {
        return res.status(400).send({
          success: false,
          message: "Incorrect credentials!",
        });
      }
    } else {
      return res.status(400).send({
        success: false,
        message: `Vendor with (${email}) does not exist!`,
      });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error!", error });
    console.log(error);
  }
};

//delete logic
export const vendorLogout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    // Delete refresh token from DB
    await Token.findOneAndDelete({ token: refreshToken });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//forgot password logic
export const vendorRequestReset = async (req, res) => {
  const { email } = req.body;
  console.log("Request body", email);
  try {
    // ensure all fields are provided
    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }
    //get user from database with email
    const vendor = await Vendor.findOne({ email });
    console.log("This is the user", vendor);
    if (!vendor) {
      return res.status(404).send({
        success: false,
        message: `Vendor with email (${email}) does not exists`,
      });
    }

    // Generate reset token and expiration
    const vendorResetToken = await crypto.randomBytes(32).toString("hex");
    console.log(vendorResetToken);
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user record with the token
    const id = vendor._id;
    const replace = {
      $set: {
        resetToken: resetTokenExpiration,
      },
    };
    const updated = await Token.updateOne({ id, replace });

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${vendorResetToken}`;
    console.log("This is the vendor email", email);
    await sendEmail(
      email || "tom3525001@gmail.com",
      "Vendor Password Reset",
      `Click here to reset your password: ${resetLink}`
    );

    res.status(200).send({
      success: true,
      message: "Reset link sent to your email.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server error. An error occured",
      error,
    });
    // next(error)
    console.log(error);
  }
};

export const vendorResetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    // Find user by token
    const vendor = await Vendor.findOne(token);
    if (!vendor || new Date(vendor.reset_token_expiration) < new Date())
      return res.status(400).send({
        success: false,
        message: "Invalid or expired token.",
      });

    //hash new password
    const hashedPassword = await hashFn(newPassword);

    // Update user's password and clear the token
    const id = Vendor._id;
    const updatePassword = {
      $set: {
        password: hashedPassword,
      },
    };
    const updateToken = {
      reset_token: "",
      reset_token_expiration: "",
    };

    const updatedPassword = await Vendor.updateOne(id, updatePassword);
    const updatedtoken = await Token.updateOne(id, updateToken);
    // await updated.save();

    res.status(200).send({
      success: true,
      message: "Vendor's account Password reset successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Server error.",
      error,
    });
  }
};

// export const uploadImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send({ message: "No file uploaded" });
//     }

//     const imageUrl = req.file ? req.file.secure_url : null;

//     // Convert file buffer to base64
//     const fileBase64 = `data:${
//       req.file.mimetype
//     };base64,${req.file.buffer.toString("base64")}`;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(fileBase64, {
//       folder: "uploads", // Optional: Set Cloudinary folder
//     });

//     res.send({
//       message: "Upload successful",
//       imageUrl: result.secure_url,
//     });
//   } catch (error) {
//     res.status(500).send({ success: false,
//       message: error.message
//     });
//   }
// };
