const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ✅ CREATE ORDER ROUTE
const axios = require("axios");

app.post("/create-order", async (req, res) => {
  try {
    const amount = req.body.amount;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const orderId = "order_" + Date.now();

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_" + Date.now(),
          customer_email: "test@gmail.com",
          customer_phone: "9999999999"
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": process.env.APP_ID,
          "x-client-secret": process.env.SECRET_KEY
        }
      }
    );

    res.json({
      payment_session_id: response.data.payment_session_id,
      order_id: orderId
    });

  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Cashfree order creation failed"
    });
  }
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});