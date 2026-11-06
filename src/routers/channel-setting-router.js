import { Router } from "express";

import channelController from "../controllers/channelController.js";
import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ============== Views ===================
router.get("/channels/settings/:id", auth, async (req, res) => {
  const channel = await channelController.findById(req.params.id);
  res.render("channel-settings", { channel: channel });
});

// ============== APIs =======================
router.patch("/api/channels/settings/:id", apiAuth, async (req, res) => {
  try {
    const channel = await channelController.findById(req.params.id);

    if (!channel) {
      return res.send({ success: false, message: "Channel Not Found!" });
    }

    const settingsType = req.body.dateType;
    delete req.body.dateType;

    if (settingsType == "signalDirectionSettings") {
      channel.directionSettings = req.body;
    } else if (settingsType == "signalCoinNameSettings") {
      channel.coinNameSettings = req.body;
    } else if (settingsType == "signalEntryPriceSettings") {
      channel.entryPriceSettings = req.body;
    } else if (settingsType == "signalOnelineTargetsSettings") {
      channel.onelineTargetsSettings = req.body;
    } else if (settingsType == "signalNextlineTargetsSettings") {
      channel.nextlineTargetsSettings = req.body;
    } else if (settingsType == "signalStoplossSettings") {
      channel.stopLossSettings = req.body;
    } else if (settingsType == "signalIncludeExcludeSettings") {
      channel.includeExcludeSettings = req.body;
    } else if (settingsType == "extractAlertsSettings") {
      channel.extractAlertsSettings = req.body;
    }

    await channel.save();
    res.send({ success: true, data: channel });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
});

export default router;
