import { Router } from "express";

import userController from "../controllers/userController.js";
import cryptoExchnageAccount from "../exchanges/binance/account.js";
import cryptoExchnageTrade from "../exchanges/binance/trade.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();

// ==================================== Views routes =========================
router.get("/user-management/:id", auth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.redirect("/users?error=User not found!");
    }

    const balanceResult = await cryptoExchnageAccount.getAccountBalance(user);

    if (!balanceResult.success) {
      return res.redirect("/users?error=" + balanceResult.msg);
    }

    res.render("user-management", {
      user: user,
      balance: balanceResult.balance,
    });
  } catch (error) {
    res.redirect("/users?error=" + error.message);
  }
});

// =================================== Api Routes ========================
// Get Positions
router.get("/api/user-management/get_positions/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const positions = await cryptoExchnageAccount.getPostions(user);

    res.json({ success: true, data: positions.data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Get Open Orders
router.get("/api/user-management/get_open_orders/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const orders = await cryptoExchnageAccount.getOpenOrders(user);

    res.json({ success: true, data: orders.data });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
});

// Get Algo Open Orders
router.get("/api/user-management/get_algo_open_orders/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const orders = await cryptoExchnageAccount.getOpenAlgoOrders(user);

    res.json({ success: true, data: orders.data });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
});

// Close Position
router.delete("/api/user-management/close_position/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const direction = req.body.positionIdx == "LONG" ? "Long" : "Short";
    const response = await cryptoExchnageTrade.closePosition(user, req.body.coinName, direction, req.body.qty);

    if (!response.success) {
      return res.json({ success: false, message: response.msg });
    }

    res.json({ success: true, data: response });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Close Open Orders
router.delete("/api/user-management/close_open_order/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const response = await cryptoExchnageTrade.cancelOrderCreateClient(req.body.coinName, user, req.body.orderId);

    if (!response.success) {
      return res.json({ success: false, message: response.msg });
    }

    res.json({ success: true, data: response });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Close Open Algo Orders
router.delete("/api/user-management/close_open_algo_order/:id", apiAuth, async (req, res) => {
  try {
    const user = await userController.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const response = await cryptoExchnageTrade.cancelTPSLOrderCreateClient(req.body.coinName, user, req.body.orderId);

    if (!response.success) {
      return res.json({ success: false, message: response.msg });
    }

    res.json({ success: true, data: response });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

export default router;
