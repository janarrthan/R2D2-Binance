import { Router } from "express";

import notificationController from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/notifications", auth, async (req, res) => {
  res.render("notifications");
});

// =================================== Api Routes ========================
// Get all notifications
router.get("/api/notifications", apiAuth, async (req, res) => {
  try {
    const notifications = await notificationController.getNotifications();
    res.json({ success: true, data: notifications });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Find a notification
router.get("/api/notifications/:id", apiAuth, async (req, res) => {
  try {
    const notif = await notificationController.findById(req.params.id);

    if (!notif) {
      return res.json({ success: false, message: "No notification found!" });
    }

    res.json({ success: true, data: notif });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Delete a notification
router.delete("/api/notifications/:id", apiAuth, async (req, res) => {
  try {
    const notif = await notificationController.deleteNotif(req.params.id);

    if (!notif) {
      return res.json({ success: false, message: "No notification found!" });
    }

    res.json({ success: true, data: notif });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

export default router;
