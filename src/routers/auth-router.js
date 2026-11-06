import { Router } from "express";
import bcrypt from "bcryptjs";
import requestIp from "request-ip";

import Auth from "../models/auth.js";
import sendMail from "../utils/email.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/", (req, res) => {
  req.session.user = undefined;
  res.render("index", { layout: "", error: req.query.error });
});

router.post("/login", async (req, res) => {
  try {
    const user = await Auth.findOne({ email: req.body.email });

    if (!user) {
      checkLoginFailedAttempts(req);
      return res.redirect("/?error=Invalid Credentials.");
    }

    if (user.attemptsLeft < 1) {
      checkLoginFailedAttempts(req);
      return res.redirect("/?error=Your account has been blocked.");
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      checkLoginFailedAttempts(req);
      await Auth.findByIdAndUpdate(user._id, { $inc: { attemptsLeft: -1 } });
      return res.redirect("/?error=Invalid Credentials.");
    }

    const userAgent = req.headers["user-agent"].trim();
    const existingDevice = user.registeredDevices.find((device) => device == userAgent);

    const updateData = { attemptsLeft: 3 };

    if (!existingDevice) {
      updateData.registeredDevices = user.registeredDevices;
      updateData.registeredDevices.push(userAgent);
    }

    await Auth.findByIdAndUpdate(user._id, updateData);
    req.session.noOfLoginFails = 0;
    req.session.user = {
      email: user.email,
    };

    res.redirect("/users");

    if (!existingDevice) {
      sendMail({ email: process.env.BREVO_RECEIVER_EMAIL, message: `New User Login From: \n ${userAgent}` });
    }
  } catch (error) {
    res.redirect("/?error=Something went wrong. Unable to login.");
  }
});

const checkLoginFailedAttempts = (req) => {
  const loginFails = req.session.noOfLoginFails ?? 0;
  req.session.noOfLoginFails = loginFails + 1;

  if (req.session.noOfLoginFails >= 3) {
    const clientIp = requestIp.getClientIp(req);
    global.blockedIps.push(clientIp);
  }
};

export default router;
