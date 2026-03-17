require("dotenv").config();
const cors = require("cors");
app.use(cors({
  origin: "https://portfolio-forgee.netlify.app"
}));
const express = require("express");
const axios   = require("axios");
const cors    = require("cors");
const app = express();
app.use(express.json());

// ─── CORS: allow your frontend origin ───────────────────────────────────────
// In production replace "*" with your actual domain, e.g. "https://yoursite.com"
app.use(cors({ origin: "*" }));

// ─── CASHFREE KEYS ───────────────────────────────────────────────────────────
const APP_ID = process.env.APP_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const CF_API_VERSION = "2023-08-01";
const CF_BASE_URL    = "https://api.cashfree.com/pg";
// For sandbox testing change to: "https://sandbox.cashfree.com/pg"

// ─── POST /create-order ──────────────────────────────────────────────────────
// Body: { orderId, amount, customerName, customerEmail, customerPhone, returnUrl }
app.post("/create-order", async (req, res) => {
  try {
    const {
      orderId,
      amount,
      customerName  = "Customer",
      customerEmail = "customer@example.com",
      customerPhone = "9999999999",
      returnUrl     = "http://localhost/submit-order.html"
    } = req.body;

    if (!amount || isNaN(parseFloat(amount)))
      return res.status(400).json({ error: "Invalid amount" });
    if (!orderId)
      return res.status(400).json({ error: "orderId is required" });

    // Cashfree needs 10-digit number, no +91 prefix
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "").slice(-10);

    const orderPayload = {
      order_id:       orderId,
      order_amount:   parseFloat(amount).toFixed(2),
      order_currency: "INR",
      customer_details: {
        customer_id:    "cust_" + orderId,
        customer_name:  customerName,
        customer_email: customerEmail,
        customer_phone: cleanPhone || "9999999999"
      },
      order_meta: {
        // {order_id} is replaced by Cashfree with the actual CF order id
        return_url: returnUrl
          + (returnUrl.includes("?") ? "&" : "?")
          + "cf_order_id={order_id}&payment=success",
        notify_url: "" // add your webhook URL here if needed
      }
    };

    const response = await axios.post(
      `${CF_BASE_URL}/orders`,
      orderPayload,
      {
        headers: {
          "x-client-id":     APP_ID,
          "x-client-secret": SECRET_KEY,
          "x-api-version":   CF_API_VERSION,
          "Content-Type":    "application/json"
        }
      }
    );

    res.json({
      payment_session_id: response.data.payment_session_id,
      cf_order_id:        response.data.cf_order_id,
      order_id:           response.data.order_id,
      order_status:       response.data.order_status
    });

  } catch (err) {
    const cfError = err.response?.data;
    console.error("Cashfree error:", cfError || err.message);
    res.status(500).json({
      error:   cfError?.message || "Failed to create payment order",
      details: cfError || null
    });
  }
});

// ─── GET /verify-payment/:orderId ────────────────────────────────────────────
app.get("/verify-payment/:orderId", async (req, res) => {
  try {
    const response = await axios.get(
      `${CF_BASE_URL}/orders/${req.params.orderId}`,
      {
        headers: {
          "x-client-id":     APP_ID,
          "x-client-secret": SECRET_KEY,
          "x-api-version":   CF_API_VERSION
        }
      }
    );
    res.json({
      order_status: response.data.order_status,
      order_id:     response.data.order_id,
      order_amount: response.data.order_amount,
      cf_order_id:  response.data.cf_order_id
    });
  } catch (err) {
    console.error("Verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Could not verify payment" });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ status: "PortfolioForge payment server running ✓" })
);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});