import Food from "../models/foodModel.js";
import Vendor from "../models/vendorModel.js"
import cloudinary from "../config/cloudinary.js";
import _ from "lodash";

export const createFood = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    try {
      console.log("Request File:", req.file); // Debugging step

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Picture is required" });
      }

      // Proceed with Cloudinary upload...
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Error creating food",
          error: error.message,
        });
    }

    let imageUrl = "";
    let result = "";
    if (req.file) {
      const fileBase64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      // console.log("🔄 Converting to Base64...", fileBase64
      // );

      // console.log("🚀 Uploading to Cloudinary...");
      try {
        result = await cloudinary.uploader.upload(fileBase64, {
          folder: "vendor_food_images",
        });
        imageUrl = result.secure_url;
        console.log("This is the base64 file", fileBase64);
      } catch (error) {
        res
          .status(500)
          .json({
            success: false,
            message: "Error with uploads",
            error: error.message,
          });
      }
    }

    console.log("✅ Cloudinary Response:", result);

    // Ensure all required fields are provided
    if (!name || !price || !imageUrl || !category || !description) {
      return res.status(400).json({ message: "Food details are required" });
    }

    // Create new food item
    const newFood = new Food({
      name,
      price,
      picture: imageUrl,
      category,
      description,
      vendor: req.vendor._id, // Attach the vendor's ID
    });

    await newFood.save();
    res
      .status(201)
      .send({ success: true, message: "Food successfully created", newFood });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error creating food",
      error: error.message,
    });
  }
};

export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id; // Extract vendor ID from the authenticated request

    // Find the food item by ID
    const food = await Food.findById(id);
    if (!food)
      return res
        .status(404)
        .send({ success: false, message: "Food item not found" });

    // Check if the logged-in vendor is the owner of the food item
    if (food.vendor.toString() !== vendorId.toString()) {
      return res.status(403).send({
        success: false,
        message: "You are not authorized to delete this food item",
      });
    }

    // Permanently delete the food item
    await Food.findByIdAndDelete(id);

    res
      .status(200)
      .send({ success: true, message: "Food item deleted successfully" });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting food",
      error: error.message,
    });
  }
};

export const updateFood = async (req, res) => {
  try {
    const { id } = req.params; // Get food ID from URL
    const vendorId = req.vendor._id; // Authenticated vendor ID

    // Find the food item by ID
    const food = await Food.findById(id);
    if (!food)
      return res
        .status(404)
        .send({ success: false, message: "Food item not found" });

    // Check if the authenticated vendor owns this food item
    if (food.vendor.toString() !== vendorId.toString()) {
      return res.status(403).send({
        success: false,
        message: "You are not authorized to update this food item",
      });
    }

    // Check if an image file is uploaded
    let imageUrl;
    if (req.file) {
      // Delete the previous image from Cloudinary if it exists
      if (food.image) {
        const imageId = food.image.split("/").pop().split(".")[0]; // Get image public ID from URL
        await cloudinary.uploader.destroy(imageId); // Delete the old image from Cloudinary
      }

      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "food_images", // Optional: specify folder on Cloudinary
        use_filename: true,
        unique_filename: false,
        resource_type: "image",
      });
      imageUrl = result.secure_url; // Store the new image URL
    } else {
      // If no image is uploaded, keep the current image URL
      imageUrl = food.image;
    }

    // Allow only specific fields to be updated
    const allowedUpdates = [
      "name",
      "price",
      "picture",
      "category",
      "description",
    ];
    const updates = _.pick(req.body, allowedUpdates);

    // If image was updated, ensure the new URL is added to updates
    if (imageUrl) {
      updates.image = imageUrl;
    }
    // Update the food item with new data
    const updatedFood = await Food.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.status(200).send({
      success: true,
      message: "Food item updated successfully",
      data: updatedFood,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating food",
      error: error.message,
    });
  }
};

export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;

    // Populate vendor field to include vendor's name
    const food = await Food.findById(id).populate("vendor", "name");
    if (!food) {
      return res
        .status(404)
        .send({ success: false, message: "Food item not found" });
    }

    res.status(200).send({
      success: true,
      message: "Food item retrieved successfully",
      data: food,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching food item",
      error: error.message,
    });
  }
};

export const searchFoodByName = async (req, res) => {
  try {
    const { name } = req.query; // Get the food name from query params

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Food name is required" });
    }

    // Find foods that match the search term (case-insensitive)
    const foods = await Food.find({
      name: { $regex: name, $options: "i" }, // "i" makes it case-insensitive
    }).populate("vendor", "name address"); // Populate vendor details (name & address)

    if (foods.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No foods found" });
    }

    res.status(200).json({ success: true, foods });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error searching for food",
        error: error.message,
      });
  }
};

export const searchFoodByCategory = async (req, res) => {
  try {
    const { category } = req.query; // Get the category from query params

    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Category is required" });
    }

    // Find foods that belong to the given category (case-insensitive)
    const foods = await Food.find({
      category: { $regex: category, $options: "i" },
    }).populate("vendor", "name address");

    if (foods.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No foods found in this category" });
    }

    res.status(200).json({ success: true, foods });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching foods",
        error: error.message,
      });
  }
};


export const filterFoodsByPrice = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.query;

    // Construct a dynamic filter
    let filter = {};
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    // Fetch foods based on the price range
    const foods = await Food.find(filter);

    res.status(200).send({
      success: true,
      count: foods.length,
      foods,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
