const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve your frontend file
app.use(express.static(__dirname));

// File where orders will be saved
const ORDERS_FILE = path.join(__dirname, "orders.json");

// Create orders.json if it doesn't exist
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, "[]", "utf-8");
}

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "foodorder.html"));
});

// Place order API
app.post("/api/order", (req, res) => {
  try {
    const { customerName, phone, address, paymentMethod, cartItems, totalAmount } = req.body;

    if (!customerName || !phone || !address || !paymentMethod || !cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide complete order details"
      });
    }

    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));

    const newOrder = {
      id: Date.now(),
      customerName,
      phone,
      address,
      paymentMethod,
      cartItems,
      totalAmount,
      orderStatus: "Pending",
      orderDate: new Date().toLocaleString()
    };

    orders.push(newOrder);

    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");

    res.json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder
    });
  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while placing the order"
    });
  }
});

// Get all orders API
app.get("/api/orders", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
    res.json({
      success: true,
      totalOrders: orders.length,
      orders
    });
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch orders"
    });
  }
});

// Get single order by ID
app.get("/api/orders/:id", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
    const order = orders.find(o => o.id == req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Single Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch order"
    });
  }
});

// Update order status
app.put("/api/orders/:id", (req, res) => {
  try {
    const { orderStatus } = req.body;
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));

    const orderIndex = orders.findIndex(o => o.id == req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    orders[orderIndex].orderStatus = orderStatus || orders[orderIndex].orderStatus;

    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: orders[orderIndex]
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update order"
    });
  }
});

// Delete order
app.delete("/api/orders/:id", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
    const filteredOrders = orders.filter(o => o.id != req.params.id);

    if (orders.length === filteredOrders.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    fs.writeFileSync(ORDERS_FILE, JSON.stringify(filteredOrders, null, 2), "utf-8");

    res.json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete order"
    });
  }
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});