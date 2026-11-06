import "dotenv/config";
import "./db/mongoose.js";

import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import express from "express";
import { Server } from "socket.io";
import expressHbs from "express-handlebars";
import session from "express-session";
import { IpFilter as ipfilter } from "express-ipfilter";
import IpDeniedError from "express-ipfilter";
import rateLimit from "express-rate-limit";

import userRouter from "./routers/user-router.js";
import telegramSigRouter from "./routers/telegramSignal-router.js";
import signalRouters from "./routers/signal-router.js";
import orderRouter from "./routers/order-router.js";
import userManagementRouter from "./routers/userManagement-router.js";
import channelRouter from "./routers/channel-router.js";
import telegramAccountsRouter from "./routers/telegram-account-router.js";
import channelSettingsRouter from "./routers/channel-setting-router.js";
import strategiesRouter from "./routers/strategies-router.js";
import notificationRouter from "./routers/notification-router.js";
import priceAlertRouter from "./routers/price-alert-router.js";
import authRouter from "./routers/auth-router.js";
import notificationController from "./controllers/notificationController.js";

import cronJob from "./cron-job.js";
import autoTrading from "./auto-trading.js";

import "./utils/uncaughtException.js";
// require("./utils/unhandledRejection.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.blockedIps = [];

const ips = function () {
  return global.blockedIps;
};

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup the session
app.use(session({ secret: process.env.SESSION_SECRET, saveUninitialized: true, resave: true }));

// Limit request allowed per ip within an hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP within an hour. Please try again in an hour.",
});
app.use("/api/", limiter);

// Setup HBS
app.engine(
  ".hbs",
  expressHbs.engine({
    layoutsDir: path.join(__dirname, "../views/layouts"),
    defaultLayout: "main",
    extname: ".hbs",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowedProtoMethodsByDefault: true,
    },
  }),
);

app.set("view engine", "hbs");
app.use(ipfilter(ips, { mode: "deny" }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(userRouter);
app.use(telegramSigRouter);
app.use(signalRouters);
app.use(orderRouter);
app.use(userManagementRouter);
app.use(channelRouter);
app.use(telegramAccountsRouter);
app.use(channelSettingsRouter);
app.use(strategiesRouter);
app.use(notificationRouter);
app.use(priceAlertRouter);
app.use(authRouter);

app.use((err, req, res, _next) => {
  if (err instanceof IpDeniedError) {
    res.status(401);
  } else {
    res.status(err.status || 500);
  }

  res.send("You are blocked from accessing this application");
});

// 404 route not found
app.all(/(.*)/, (req, res) => {
  res.send("404 page not found");
});

server.listen(process.env.PORT);

// Run Cron Job
cronJob.runCronJob(io);
cronJob.createAdminUser();
cronJob.createTimeKeeper();

// Run auto trading
autoTrading.start();
