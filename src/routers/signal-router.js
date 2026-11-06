import { Router } from "express";

import btSignalController from "../controllers/btSignalController.js";
import orderController from "../controllers/orderController.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/signals", auth, async (req, res) => {
  res.render("signals");
});

// ==================================== API routes =========================
// GET SIGNALS
router.get("/api/signals", apiAuth, async (req, res) => {
  try {
    const signals = await btSignalController.findMany({ status: "Active" }, { path: "channel" });

    res.json({ success: true, data: signals });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// FIND A SIGNAL
router.get("/api/signals/:id", apiAuth, async (req, res) => {
  try {
    const signal = await btSignalController.findById(req.params.id);

    if (!signal) {
      return res.json({ success: false, message: "Signal not found!" });
    }

    res.json({ success: true, data: signal });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// DELETE SIGNAL
router.delete("/api/signals/:id", apiAuth, async (req, res) => {
  try {
    const signal = await btSignalController.findById(req.params.id);

    if (!signal) {
      return res.json({ success: false, message: "Signal not found!" });
    }

    const orders = await orderController.findOrders({
      signalId: signal._id,
    });

    if (orders.length > 0) {
      return res.json({
        success: false,
        message: "Not allowed. Orders for this signal should be deleted first!",
      });
    }

    await btSignalController.deleteById(signal._id);
    res.json({ success: true, data: signal });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default router;
