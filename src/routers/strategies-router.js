import { Router } from "express";

import channelController from "../controllers/channelController.js";
import strategyController from "../controllers/strategyController.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ============== Views ===================
router.get("/strategies", auth, async (req, res) => {
  const channels = await channelController.getChannels();
  res.render("strategies", { channels: channels });
});

// =================================== Api Routes ========================
// Create a strategy
router.post("/api/strategies", apiAuth, async (req, res) => {
  try {
    const mainStrategyType = req.body.type;

    if (mainStrategyType == "NTS" || mainStrategyType == "PENTS") {
      if (parseInt(req.body.tradeCancelTargetNo) < parseInt(req.body.selectedTargetNo)) {
        return res.json({
          success: false,
          message: "Trade Cancel Target No Should be bigger or equals to Selected Target No",
        });
      }
    }

    const strategy = await strategyController.create(req.body);
    res.send({ success: true, data: strategy });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get all strategies
router.get("/api/strategies", apiAuth, async (req, res) => {
  try {
    const strategies = await strategyController.getAll();
    res.json({ success: true, data: strategies });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Find a strategy
router.get("/api/strategies/:id", apiAuth, async (req, res) => {
  try {
    const strategy = await strategyController.findById(req.params.id);

    if (!strategy) {
      return res.json({ success: false, message: "No strategy found!" });
    }

    res.json({ success: true, data: strategy });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Update a strategy
router.patch("/api/strategies/:id", apiAuth, async (req, res) => {
  try {
    const mainStrategyType = req.body.type;

    if (mainStrategyType == "NTS" || mainStrategyType == "PENTS") {
      if (parseInt(req.body.tradeCancelTargetNo) < parseInt(req.body.selectedTargetNo)) {
        return res.json({
          success: false,
          message: "Trade Cancel Target No Should be bigger or equals to Selected Target No",
        });
      }
    }

    const strategy = await strategyController.updateById(req.params.id, req.body);
    res.send({ success: true, data: strategy });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Delete a strategy
router.delete("/api/strategies/:id", apiAuth, async (req, res) => {
  try {
    const strategy = await strategyController.deleteById(req.params.id);
    res.send({ success: true, data: strategy });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default router;
