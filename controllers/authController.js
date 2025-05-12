import User from "../models/userModel.js";
import Token from "../models/tokenModel.js";
import Vendor from "../models/vendorModel.js";
const { hashFn, comparePasswords, sendEmail } = utils;
import cloudinary from "../config/cloudinary.js";
import utils from "../utils/utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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

    if (!username || !email || !password || !phone) {
      return res
        .status(400)
        .send({ success: false, message: "All fields required!" });
    }

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
        await Token.create({ userId, token: refreshToken, type: "refresh" });
      };

      //To compare passwords
      const getPassword = user.password;
      console.log("Passwords must match,", password, getPassword);
      if (await comparePasswords(password, getPassword)) {
        console.log("This is the user token", token);
        // console.log(mongoose.Schema.Types.ObjectId);
        await storeRefreshToken(user._id, refresh_token);
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

export const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id; // Extracted from verifyToken middleware
    console.log(userId);

    // Ensure all fields are provided
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required" });
    }

    const user = await User.findById(userId);
    // Compare old password with the stored hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ success: false, message: "Old password is incorrect" });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .send({ success: false, message: "New passwords do not match" });
    }

    // Find the user by ID
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await hashFn(newPassword);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .send({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(user);
    res
      .status(500)
      .send({ success: false, message: "Server error", error: error.message });
  }
};

export const changeUsername = async (req, res) => {
  const { newUsername } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  try {
    if (!user) {
      return res
        .status(404)
        .send({ succes: false, message: "This user does not exist!" });
    }

    // Check if the new username is already taken
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }
    user.username = newUsername;
    await user.save();

    res.status(200).json({ message: "Username updated successfully", user });
  } catch (error) {
    res.status(500).send({ success: false, message: "This is the error" });
    console.log(error, error.message);
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
  console.log("Request body:", email);
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
    // const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user record with the token
    await Token.findOneAndUpdate(
      { userId: user._id, type: "reset" },
      {
        userId: user._id,
        token: userResetToken,
        type: "reset",
        createdAt: Date.now(), // Ensures expiration works
      },
      { upsert: true, new: true } // Create if not exist, return updated
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${userResetToken}`;
    console.log("This is the user email", email, resetLink);
    await sendEmail(
      email || "tom3525001@gmail.com",
      "Password Reset",
      `Click here to reset your password: ${resetLink}`
    );

    res.status(200).send({
      success: true,
      message: "Reset link sent to your email.",
      userResetToken,
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

export const verifyUserResetToken = async (req, res) => {
  const { token } = req.query; // Token from URL

  try {
    console.log("Token from request:", token);

    const resetToken = await Token.findOne({ token, type: "reset" });

    console.log("Token from database:", resetToken);

    if (!resetToken) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid or expired token" });
    }

    // Check token expiration
    const now = new Date();
    const expirationTime = resetToken.createdAt.getTime() + 3600000; // 1 hour
    console.log("Token Expiration Time:", new Date(expirationTime));
    console.log("Current Time:", now);

    if (now.getTime() > expirationTime) {
      return res
        .status(400)
        .send({ success: false, message: "Token has expired" });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      userId: resetToken.userId,
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res
      .status(500)
      .send({ success: false, message: "Server error", error: error.message });
  }
};

export const userResetPassword = async (req, res) => {
  const { token } = req.query;
  const { newPassword } = req.body;
  try {
    // Find user by token
    const resetToken = await Token.findOne({ token, type: "reset" });
    if (!resetToken || new Date(resetToken.reset_token_expiration) < new Date())
      return res.status(400).send({
        success: false,
        message: "Invalid or expired token.",
      });

    // Find the user by the userId stored in the Token model
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    //hash new password
    const hashedPassword = await hashFn(newPassword);

    user.password = hashedPassword; // You should hash this before saving
    await user.save();

    // Delete the token after successful reset
    await Token.deleteOne({ _id: resetToken._id });

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
  const { name, companyName, email, phone, address, preference, password } =
    req.body;

  const hashedPassword = await hashFn(password);

  try {
    // Check if user exists
    const exists = await Vendor.findOne({ email });
    if (exists)
      return res
        .status(400)
        .send({ success: false, message: "Vendor already exists" });

    if (
      !name ||
      !companyName ||
      !email ||
      !phone ||
      !address ||
      !preference ||
      !password
    ) {
      return res
        .status(400)
        .send({ success: false, message: "All fields required!" });
    }

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
      phone,
      picture: imageUrl,
      address,
      preference,
      password: hashedPassword,
    });
    await vendor.save();

    res.status(201).send(
      {
      success: true,
      message: "Vendor registered successfully",
      data: vendor,
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(error);
      console.log(req.body);
      // console.log(Vendor.schema.paths);
      return res.status(400).send({
        success: false,
        message: "Duplicate field error: " + JSON.stringify(error.keyValue),
      });
    }
    res.status(500).send({
      success: false,
      message: `Server error!, ${error.message}`,
      error,
    });
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
        { id: vendor._id, companyName: vendor.companyName },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // res.send({ token });
      const refresh_token = jwt.sign(
        { id: vendor._id, companyName: vendor.companyName },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "24h",
        }
      );

      const storeRefreshToken = async (userId, refreshToken) => {
        await Token.create({ userId, token: refreshToken, type: "refresh" });
      };

      //To compare passwords
      const getPassword = vendor.password;
      console.log("Passwords must match,", password, getPassword);
      if (await comparePasswords(password, getPassword)) {
        console.log("This is the vendor token", token);
        // console.log(mongoose.Schema.Types.ObjectId);
        await storeRefreshToken(vendor._id, refresh_token);
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

export const changeVendorPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const vendorId = req.user.id; // Extracted from verifyToken middleware
    console.log(vendorId);

    // Ensure all fields are provided
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required" });
    }

    const vendor = await Vendor.findById(vendorId);
    // Compare old password with the stored hash
    const isMatch = await bcrypt.compare(oldPassword, vendor.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ success: false, message: "Old password is incorrect" });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .send({ success: false, message: "New passwords do not match" });
    }

    // Find the user by ID
    if (!vendor) {
      return res
        .status(404)
        .send({ success: false, message: "Vendor not found" });
    }

    // Hash the new password
    const hashedPassword = await hashFn(newPassword);

    // Update user's password
    vendor.password = hashedPassword;
    await vendor.save();

    res
      .status(200)
      .send({ success: true, message: "Password changed successfully" });
    console.log(vendor);
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Server error", error: error.message });
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
    // Generate reset token and expiration
    const vendorResetToken = await crypto.randomBytes(32).toString("hex");
    console.log(vendorResetToken);
    // const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user record with the token
    await Token.findOneAndUpdate(
      { userId: vendor._id, type: "reset" },
      {
        userId: vendor._id,
        token: vendorResetToken,
        type: "reset",
        createdAt: Date.now(), // Ensures expiration works
      },
      { upsert: true, new: true } // Create if not exist, return updated
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password/${vendorResetToken}`;
    console.log(resetLink);
    console.log("This is the vendor email", email);
    await sendEmail(
      email || "tom3525001@gmail.com",
      "Vendor Password Reset",
      `Click here to reset your password: ${resetLink}`
    );

    res.status(200).send({
      success: true,
      message: "Reset link sent to your email.",
      vendorResetToken,
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

export const verifyVendorResetToken = async (req, res) => {
  const { token } = req.query; // Token from URL

  try {
    console.log("Token from request:", token);

    const resetToken = await Token.findOne({ token, type: "reset" });

    console.log("Token from database:", resetToken);

    if (!resetToken) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid or expired token" });
    }

    // Check token expiration
    const now = new Date();
    const expirationTime = resetToken.createdAt.getTime() + 3600000; // 1 hour
    console.log("Token Expiration Time:", new Date(expirationTime));
    console.log("Current Time:", now);

    if (now.getTime() > expirationTime) {
      return res
        .status(400)
        .send({ success: false, message: "Token has expired" });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      vendorId: resetToken.userId,
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res
      .status(500)
      .send({ success: false, message: "Server error", error: error.message });
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

    vendor.password = hashedPassword; // You should hash this before saving
    await vendor.save();

    // Delete the token after successful reset
    await Token.deleteOne({ _id: resetToken._id });

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
