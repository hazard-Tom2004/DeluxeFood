import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModel.js"; // Assuming you have a Vendor model

export const verifyVendor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) return res.status(401).json({ message: "Access Denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendor = await Vendor.findById(decoded.id);

    if (!vendor) return res.status(403).json({ message: "Not a valid vendor" });

    req.vendor = vendor; // Attach vendor data to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

