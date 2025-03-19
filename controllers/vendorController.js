import Vendor from "../models/vendorModel.js";
import Food from "../models/foodModel.js"


export const searchVendorByCompanyName = async (req, res) => {
    try {
      const { companyName } = req.query; // Get company name from query parameters
  
      if (!companyName) {
        return res
          .status(400)
          .send({ success: false, message: "Company name is required!" });
      }
  
      // Find vendor by companyName (case-insensitive)
      const vendor = await Vendor.findOne({
        companyName: { $regex: companyName, $options: "i" },
      });
  
      if (!vendor) {
        return res
          .status(404)
          .send({ success: false, message: "Vendor not found" });
      }
  
      // Find all foods linked to this vendor
      const foods = await Food.find({ vendor: vendor._id });
  
      res.status(200).send({
        success: true,
        message: "This is the Vendor",
        vendor,
        foods,
      });
    } catch (error) {
      res
        .status(500)
        .send({
          success: false,
          message: "Error fetching vendor and foods",
          error: error.message,
        });
    }
  };

  export const getVendorById = async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.params.id);
  
      if (!vendor) {
        return res.status(404).send({
          success: false,
          message: "Vendor not found",
        });
      }
  
      res.status(200).send({
        success: true,
        message: "Vendor successfully fetched", 
        vendor,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Server error while fetching vendor",
        error: error.message,
      });
    }
  };

export const getAllVendors = async (req, res) => {
    try {
      const vendors = await Vendor.find(); // Fetch all vendors
  
      if (!vendors.length) {
        return res.status(404).send({
          success: false,
          message: "No vendors found",
        });
      }
  
      res.status(200).send({
        success: true,
        count: vendors.length,
        message: "These are the lists of Vendors:",
        vendors,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Server error while fetching vendors",
        error: error.message,
      });
    }
  };