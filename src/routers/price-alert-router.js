import { Router } from "express";
import PriceAlert from "../models/priceAlert.js";
import binanceUtils from "../exchanges/binance/utils.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/price-alerts", auth, async (req, res) => {
  res.render("price-alerts");
});

// =================================== Api Routes ========================
// Get all alerts
router.get("/api/price-alerts", apiAuth, async (req, res) => {
  try {
    const alerts = await PriceAlert.find({});
    res.json({ success: true, data: alerts });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Create an alert
router.post("/api/price-alerts", apiAuth, async (req, res) => {
  try {
    var coinName = req.body.coinName.trim().toUpperCase();
    const targetPrice = parseFloat(req.body.targetPrice);
    const direction = req.body.direction;

    if (!coinName.includes("USDT")) {
      coinName += "USDT";
    }

    const existAlert = await PriceAlert.findOne({
      coinName: coinName,
      targetPrice: req.body.targetPrice,
      direction: req.body.direction,
    });

    if (existAlert) {
      return res.send({ message: "Alert already exist." });
    }

    const currentPrice = await binanceUtils.getMarketPrice(coinName);

    if (!currentPrice) {
      return res.send({ message: "Invalid coin name!" });
    }

    if (currentPrice < targetPrice && direction === "down") {
      return res.send({ message: "Target price should not be higher than the current price for down direction." });
    }

    if (currentPrice > targetPrice && direction === "up") {
      return res.send({ message: "Target price should not be less than the current price for up direction." });
    }

    req.body.coinName = coinName;

    const alert = new PriceAlert(req.body);
    await alert.save();
    res.send({ success: true, data: [] });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// Delete
router.delete("/api/price-alerts/:id", apiAuth, async (req, res) => {
  try {
    const alert = await PriceAlert.findByIdAndDelete(req.params.id);
    res.send({ success: true, data: alert });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default router;
