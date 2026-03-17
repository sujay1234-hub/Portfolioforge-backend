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
app.post("/create-order", async (req, res) => {
  try {
    const amount = req.body.amount;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // 🔥 Fake response (for now testing)
    // Replace later with real Cashfree API call
    return res.json({
      payment_session_id: "test_session_" + Date.now()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});