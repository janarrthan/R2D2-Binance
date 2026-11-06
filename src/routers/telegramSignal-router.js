import { Router } from "express";

import btSignalController from "../controllers/btSignalController.js";
import telegramSigController from "../controllers/telegramSigController.js";
import channelController from "../controllers/channelController.js";
import messageHandler from "../telegram/messageHandler.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/telegram-signals", auth, async (req, res) => {
  const channels = await channelController.getChannels();
  res.render("telegram-signals", { channels: channels });
});

// ==================================== API routes =========================
// CREATE TELEGRAM SIGNAL
router.post("/api/telegram-signals", apiAuth, async (req, res) => {
  try {
    const channel = await channelController.findById(req.body.channel);

    if (!channel) {
      return res.json({
        success: false,
        message: "Telegram channel not found!",
      });
    }
    const telAccount = global.telAccounts["acc-" + channel.channelAccount];

    if (!telAccount) {
      return res.json({ success: false, message: "Telegram account not found. Please restart the application" });
    }

    const result = await telAccount.startAndFindMessage(channel, req.body.messageId);

    if (result.error) {
      return res.json({ success: false, message: result.error });
    }

    const isCreateSignal = req.body.isCreateBTSignal;
    const isSendMessage = req.body.isSendMessage;
    const isCreateTrade = req.body.isCreateTrade;

    result.messages[0].message = req.body.message;

    await messageHandler.handleMessage(result.messages[0], channel, isCreateSignal, isSendMessage, isCreateTrade);

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// GET TELEGRAM SIGNALS
router.get("/api/telegram-signals", apiAuth, async (req, res) => {
  try {
    const signals = await telegramSigController.findMany(
      {
        status: "Active",
      },
      { path: "channel" }
    );

    res.json({ success: true, data: signals });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// GET A TELEGRAM SIGNAL
router.get("/api/telegram-signals/:id", apiAuth, async (req, res) => {
  try {
    const signal = await telegramSigController.findById(req.params.id);

    if (!signal) {
      return res.json({ success: false, message: "Signal not found!" });
    }

    res.json({ success: true, data: signal });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// GET TELEGRAM MESSAGE
router.get("/api/telegram-signals/fill/:channelId/:messageId", apiAuth, async (req, res) => {
  try {
    const channel = await channelController.findById(req.params.channelId);

    if (!channel) {
      return res.json({ success: false, message: "Channel not found!" });
    }

    const telAccount = global.telAccounts["acc-" + channel.channelAccount];

    if (!telAccount) {
      return res.json({ success: false, message: "Telegram account not found. Please restart the application" });
    }

    const result = await telAccount.startAndFindMessage(channel, req.params.messageId);

    if (result.error) {
      return res.json({ success: false, message: result.error });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// DELETE TELEGRAM SIGNAL
router.delete("/api/telegram-signals/:id", apiAuth, async (req, res) => {
  try {
    const telSignal = await telegramSigController.findById(req.params.id);

    if (!telSignal) {
      return res.json({ success: false, message: "Signal not found!" });
    }

    const btSignal = await btSignalController.findOne({
      telegramSignalId: telSignal._id,
    });

    if (btSignal) {
      return res.json({
        success: false,
        message: "Not allowed. Beyond Training Signal Should be deleted first!",
      });
    }

    await telegramSigController.deleteSignal(telSignal._id);
    res.json({ success: true, data: telSignal });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

export default router;
