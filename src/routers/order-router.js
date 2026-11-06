import { Router } from "express";

import orderController from "../controllers/orderController.js";
import btSignalController from "../controllers/btSignalController.js";
import userController from "../controllers/userController.js";
import cryptoExchange from "../exchanges/binance/trade.js";

import auth from "../middleware/auth.js";
import apiAuth from "../middleware/api-auth.js";

const router = Router();
// ==================================== Views routes =========================
router.get("/orders/:signalId", auth, async (req, res) => {
  try {
    const signal = await btSignalController.findById(req.params.signalId);

    if (!signal) {
      return res.redirect("/signals");
    }

    const signalData = {
      dateAdded: new Date(signal.dateAdded).toLocaleString(),
      coinName: signal.coinName,
      _id: signal._id,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      targetPrice: signal.targetPrice,
      stopLoss: signal.stopLoss,
      status: signal.status,
    };

    res.render("orders", { signal: signalData });
  } catch (error) {
    console.log(error);
  }
});

// ==================================== API routes =========================
// CREATE SIGNAL
router.post("/api/orders", apiAuth, async (req, res) => {
  try {
    const signal = await btSignalController.findById(req.body.signalId);

    if (!signal) {
      return res.json({ success: false, message: "Signal not found!" });
    }

    const usersEmails = req.body.usersEmails.split("\n").map((email) => email.trim().toLowerCase());

    const users = await userController.findUsersByEmails(usersEmails);

    var invalidEmails = [];

    usersEmails.forEach((email) => {
      const tempUser = users.find((user) => user.email == email);
      if (!tempUser) {
        invalidEmails.push(email);
      }
    });

    if (invalidEmails.length > 0) {
      return res.json({
        success: false,
        message: "Invalid emails! \n " + invalidEmails.toString(),
      });
    }

    // create orders
    await cryptoExchange.createTradeForMultipleUsers(signal, users);

    res.json({ success: true, data: signal });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});

// GET ORDERS
router.get("/api/orders/:signalId", apiAuth, async (req, res) => {
  try {
    const orders = await orderController.getSignalOrders(req.params.signalId);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// DELETE ORDER
router.delete("/api/orders/:id", apiAuth, async (req, res) => {
  try {
    const order = await orderController.findOrderByIdFullDetails(req.params.id);

    if (!order) {
      return res.json({ success: false, message: "Order not found!" });
    }

    const response = await cryptoExchange.cancelTradeSingleUser(order.signalId.coinName, order.userId, order);

    if (!response.success) {
      return res.json({
        success: false,
        message: response.msg,
      });
    }

    await orderController.deleteOrder(order._id);
    res.json({ success: true, data: order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// CANCELL ALL ORDERS FOR A SIGNAL
router.delete("/api/orders/cancell/:id", apiAuth, async (req, res) => {
  try {
    const orders = await orderController.findOrdersFullDetails({
      signalId: req.params.id,
    });

    if (orders.length < 1) {
      return res.json({ success: false, message: "No orders to cancell!" });
    }

    for (var i = 0; i < orders.length; i++) {
      const order = orders[i];

      const response = await cryptoExchange.cancelTradeSingleUser(order.signalId.coinName, order.userId, order);

      if (!response.success) {
        return res.json({
          success: false,
          message: response.msg,
        });
      }

      await orderController.deleteOrder(order._id);
    }

    res.json({ success: true, data: "Orders cancelled successfully!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default router;

// SAVE SIGNAL
// router.post("/api/orders/save", apiAuth, async (req, res) => {
//   try {
//     const signal = await btSignalController.findById(req.body.signalId);

//     if (!signal) {
//       return res.json({ success: false, message: "Signal not found!" });
//     }

//     const user = await userController.findUser({ email: req.body.email });

//     if (!user) {
//       return res.json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const order = await orderController.createOrder({
//       signalId: signal._id,
//       userId: user._id,
//       bybitOrderId: req.body.bybitOrderId,
//     });

//     res.json({ success: true, data: order });
//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// });
