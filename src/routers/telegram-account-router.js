import { Router } from "express";

import telAccountController from "../controllers/telegramAccountController.js";
import channelController from "../controllers/channelController.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/telegram-accounts", auth, async (req, res) => {
  res.render("telegram-accounts");
});

// =================================== Api Routes ========================
// Create a account
router.post("/api/telegram-accounts", apiAuth, async (req, res) => {
  try {
    const telAccount = await telAccountController.createAccount(req.body);
    res.send({ success: true, data: telAccount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get all accounts
router.get("/api/telegram-accounts", apiAuth, async (req, res) => {
  try {
    const accounts = await telAccountController.getAccounts();
    res.json({ success: true, data: accounts });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Find an account
router.get("/api/telegram-accounts/:id", apiAuth, async (req, res) => {
  try {
    const account = await telAccountController.findById(req.params.id);

    if (!account) {
      return res.json({ success: false, message: "No account found!" });
    }

    res.json({ success: true, data: account });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Update an account
router.patch("/api/telegram-accounts/:id", apiAuth, async (req, res) => {
  try {
    const account = await telAccountController.updateById(req.params.id, req.body);
    res.send({ success: true, data: account });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// Delete an account
router.delete("/api/telegram-accounts/:id", apiAuth, async (req, res) => {
  try {
    const channels = await channelController.findByTelegramAccount(req.params.id);

    if (channels) {
      return res.json({
        success: false,
        message: "Unable to delete account. Please delete the channels which are on this account first.",
      });
    }

    const account = await telAccountController.deleteById(req.params.id);
    res.send({ success: true, data: account });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default router;
