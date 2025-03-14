import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js"; // Assuming you have a Vendor model
import User from "../models/userModel.js"; // Assuming you have a Vendor model


export const verifyVendor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) return res.status(401).json({ message: "Access Denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendor = await Vendor.findById(decoded.id);

    if (!vendor) return res.status(403).json({ message: "Not a valid vendor" });

    req.token = token;
    req.vendor = vendor; // Attach vendor data to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) return res.status(401).send({ message: "Access Denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(403).send({ message: "Not a valid vendor" });

    req.token = token
    req.user = user; // Attach user data to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

