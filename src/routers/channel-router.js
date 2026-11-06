import { Router } from "express";

import channelController from "../controllers/channelController.js";
import telAccountController from "../controllers/telegramAccountController.js";
import signalController from "../controllers/btSignalController.js";
import telSignalController from "../controllers/telegramSigController.js";
import strategyController from "../controllers/strategyController.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

import telegramUtils from "../telegram/telegramUtils.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/channels", auth, async (req, res) => {
  const accounts = await telAccountController.getAccounts();
  res.render("channels", { accounts: accounts });
});

// =================================== Api Routes ========================
// Create a channel
router.post("/api/channels", apiAuth, async (req, res) => {
  try {
    const result = await verifyChannelId(req.body);

    if (!result.success) {
      return res.send(result);
    }

    const channel = await channelController.createChannel(result.data);

    res.send({ success: true, data: channel });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// Get all channels
router.get("/api/channels", apiAuth, async (req, res) => {
  try {
    const channels = await channelController.getChannels();
    res.json({ success: true, data: channels });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Find a channel
router.get("/api/channels/:id", apiAuth, async (req, res) => {
  try {
    const channel = await channelController.findById(req.params.id);

    if (!channel) {
      return res.json({ success: false, message: "No channel found!" });
    }

    res.json({ success: true, data: channel });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Update a channel
router.patch("/api/channels/:id", apiAuth, async (req, res) => {
  try {
    const result = await verifyChannelId(req.body);

    if (!result.success) {
      return res.send(result);
    }

    const channel = await channelController.updateById(req.params.id, result.data);
    res.send({ success: true, data: channel });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// Delete a channel
router.delete("/api/channels/:id", apiAuth, async (req, res) => {
  try {
    const signal = await signalController.findOne({ channel: req.params.id });

    if (signal) {
      return res.json({
        success: false,
        message: "Unable to delete channel. Please delete the signals which are on this channel first.",
      });
    }

    const telegramSignal = await telSignalController.findOne({ channel: req.params.id });

    if (telegramSignal) {
      return res.json({
        success: false,
        message: "Unable to delete channel. Please delete the telegram signals which are on this channel first.",
      });
    }

    const strategies = await strategyController.deleteMany({ channel: req.params.id });
    const channel = await channelController.deleteById(req.params.id);
    res.send({ success: true, data: channel });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

const verifyChannelId = async (data) => {
  const telAccount = await telegramUtils.getTelegramAccount(data.channelAccount);
  const channelDetails = await telAccount.startAndGetChannelInfo(data.channelId);

  if (!channelDetails.id) {
    return { success: false, message: "Invalid Channel" };
  }

  data.channelId = parseInt(channelDetails.id);

  const replyToTelAccount = await telegramUtils.getTelegramAccount(data.replyToChannelAccount);
  const replyToChannelDetails = await replyToTelAccount.startAndGetChannelInfo(data.replyToChannelId);

  if (!replyToChannelDetails.id) {
    return { success: false, message: "Invalid Reply To Channel" };
  }

  data.replyToChannelId = parseInt(replyToChannelDetails.id);

  return { success: true, data: data };
};

export default router;
