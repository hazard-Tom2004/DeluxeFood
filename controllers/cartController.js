// controllers/cartController.js
import Cart from '../models/cartModel.js';
import Food from '../models/foodModel.js';

// Calculate total price of the cart
export const calculateTotal = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId }).populate('items.foodId');
    if (!cart) {
      throw new Error('Cart not found');
    }

    let total = 0;
    cart.items.forEach(item => {
      total += item.foodId.price * item.quantity; // Multiply price by quantity
    });

    return total;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const addToCart = async (userId, foodId, quantity) => {
  try {
    // Find the product details by ID
    const food = await Food.findById(foodId);
    if (!food) {
      throw new Error('Food not found');
    }

    // Find or create the cart for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if the product already exists in the cart
    const existingItem = cart.items.find(item => item.foodId.toString() === foodId);
    if (existingItem) {
      // Update the quantity if the product is already in the cart
      existingItem.quantity += quantity;
    } else {
      // Add a new product to the cart
      cart.items.push({ foodId, quantity });
    }

    // Save the updated cart
    await cart.save();
    return await calculateTotal(userId); // Return the updated total
  } catch (error) {
    throw new Error(error.message);
  }
};

// Decrease product quantity in the cart
export const decreaseQuantity = async (userId, foodId) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    const existingItem = cart.items.find(item => item.foodId.toString() === foodId);
    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity -= 1; // Decrease quantity by 1
      } else {
        // Remove the item if quantity becomes 0
        cart.items = cart.items.filter(item => item.foodId.toString() !== foodId);
      }
      await cart.save();
    }

    return await calculateTotal(userId); // Return updated total
  } catch (error) {
    throw new Error(error.message);
  }
};

// Increase product quantity in the cart
export const increaseQuantity = async (userId, foodId) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    const existingItem = cart.items.find(item => item.foodId.toString() === foodId);
    if (existingItem) {
      existingItem.quantity += 1; // Increase quantity by 1
      await cart.save();
    }

    return await calculateTotal(userId); // Return updated total
  } catch (error) {
    throw new Error(error.message);
  }
};


// Remove item from the cart
export const removeFromCart = async (userId, foodId) => {
    try {
      // Find the user's cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error('Cart not found');
      }
  
      // Remove the item from the cart
      cart.items = cart.items.filter(item => item.foodId.toString() !== foodId);
  
      // Save the updated cart
      await cart.save();
  
      return await calculateTotal(userId); // Return updated total
    } catch (error) {
      throw new Error(error.message);
    }
  };

  export const getCart = async (userId) => {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) return { userId, items: [], total: 0 };
    return cart;
  };