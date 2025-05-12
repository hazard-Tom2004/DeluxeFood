// socket/cartSocket.js
// export default function cartSocket(io) {
//     io.on('connection', (socket) => {
//       console.log('🟢 A user connected');

//       // This listens for a real-time event from the frontend
//       socket.on('addToCart', async (data) => {
//         // You might call a function from the controller here 👇
//         const updatedCart = await addToCart(data);
//         io.to(data.userId).emit('cartUpdated', updatedCart);
//       });

//       socket.on('disconnect', () => {
//         console.log('🔴 A user disconnected');
//       });
//     });
//   }
// socket/cartSocket.js
import {
  addToCart,
  decreaseQuantity,
  increaseQuantity,
  calculateTotal,
  removeFromCart,
  getCart,
} from "../controllers/cartController.js";

export default function cartSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    // Add to cart
    socket.on("addToCart", async (data) => {
      try {
        const updatedCart = await addToCart(data);
        socket.emit("cartUpdated", updatedCart);
      } catch (err) {
        socket.emit("cartError", { message: err.message });
      }
    });

    // Remove from cart
    socket.on("removeFromCart", async (data) => {
      try {
        const updatedCart = await removeFromCart(data);
        socket.emit("cartUpdated", updatedCart);
      } catch (err) {
        socket.emit("cartError", { message: err.message });
      }
    });

    // Update quantity
    socket.on("updateQuantity", async (data) => {
      try {
        const updatedCart = await updateQuantity(data);
        socket.emit("cartUpdated", updatedCart);
      } catch (err) {
        socket.emit("cartError", { message: err.message });
      }
    });

    // Get current cart
    socket.on("getCart", async ({ userId }) => {
      try {
        const cart = await getCart(userId);
        socket.emit("cartData", cart);
      } catch (err) {
        socket.emit("cartError", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
}
