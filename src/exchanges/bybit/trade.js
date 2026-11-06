import { RestClientV5 } from "bybit-api";
import BybitError from "../../utils/BybitError.js";
import bybitAccount from "./account.js";
import bybitUtils from "./utils.js";

import notificationController from "../../controllers/notificationController.js";
import orderController from "../../controllers/orderController.js";

// function to place a bybit order
const placeOrder = async (client, signal, qty) => {
  try {
    const response = await client.submitOrder({
      category: "linear",
      symbol: signal.coinName,
      isLeverage: 1,
      side: signal.direction == "Long" ? "Buy" : "Sell",
      orderType: "Limit",
      qty: qty.toString(),
      price: signal.entryPrice.toString(),
      takeProfit: signal.targetPrice.toString(),
      stopLoss: signal.stopLoss.toString(),
      tpTriggerBy: "MarkPrice",
      slTriggerBy: "MarkPrice",
      tpslMode: "Partial",
      positionIdx: signal.direction == "Long" ? 1 : 2,
    });

    if (response.retCode != 0) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true, orderId: response.result.orderId };
  } catch (error) {
    throw new BybitError(response.retMsg, 4);
  }
};

// function to put trade for multiple users
const createTradeForMultipleUsers = async (signal, users) => {
  const coinInfo = await bybitUtils.getCoinInfo(signal.coinName);

  for (var i = 0; i < users.length; i++) {
    const user = users[i];
    const userStrategy = user.tradingStrategies.find(
      (str) => str.strategyId.toString() == signal.strategyId.toString(),
    );

    if (!userStrategy) {
      continue;
    }

    var qty = bybitUtils.getTradeQty(coinInfo, signal.entryPrice, userStrategy.strategyAmount);

    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const changeLevRes = await changeLeverage(client, signal.coinName, coinInfo.leverage.maxLeverage);

    if (!changeLevRes.success) {
      await notificationController.createBybitError(changeLevRes, user);
      continue;
    }

    const response = await placeOrder(client, signal, qty);

    if (!response.success) {
      await notificationController.createBybitError(response, user);
      continue;
    }

    const orderDetails = {
      signalId: signal._id,
      userId: user._id,
      bybitOrderId: response.orderId,
      coinName: signal.coinName,
      qty: qty,
      positionIdx: signal.direction == "Long" ? 1 : 2,
    };

    await orderController.createOrder(orderDetails);
  }
};

// function to cancell order
const cancelOrder = async (coinName, user, orderId) => {
  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const response = await client.cancelOrder({
      category: "linear",
      symbol: coinName,
      orderId: orderId,
    });

    if (response.retCode != 0) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true };
  } catch (error) {
    throw new BybitError(response.retMsg, 4);
  }
};

// function to cancell trades for all users
const cancelTradeAllUsers = async (signal) => {
  const orders = await orderController.findOrdersWithUsersFullDetails({
    signalId: signal._id,
  });

  for (var i = 0; i < orders.length; i++) {
    const order = orders[i];
    const user = order.userId;

    if (!user) {
      await notificationController.createAppError(
        `App Error: Unable to cancell order (${signal.coinName}). User not found \n SignalId: ${signal._id} \n UserId: ${order.userId}`,
      );
      continue;
    }

    const response = await cancelOrder(signal.coinName, user, order.bybitOrderId);

    if (!response.success) {
      await notificationController.createBybitError(response, user);
      continue;
    }
  }
};

// Update stop loss or target profit
const updateTPSLOrder = async (client, signal, orderId, triggerPrice) => {
  try {
    const response = await client.amendOrder({
      category: "linear",
      symbol: signal.coinName,
      orderId: orderId,
      triggerPrice: triggerPrice.toString(),
    });

    if (response.retCode != 0) {
      console.log(response);
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true };
  } catch (error) {
    throw new BybitError(response.retMsg, 4);
  }
};

// Change TP/SL for many users
const updateTPSLManyUsers = async (signal, orders) => {
  for (var i = 0; i < orders.length; i++) {
    const order = orders[i];
    const user = order.userId;

    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const tpslOrdersRes = await bybitAccount.getTPSLOrdersForSymbol(client, signal.coinName);

    if (!tpslOrdersRes.success) {
      await notificationController.createBybitError(tpslOrdersRes, user);
      continue;
    }

    const tpslOrders = tpslOrdersRes.data;

    for (var k = 0; k < tpslOrders.length; k++) {
      const tpslOrder = tpslOrders[k];
      const stopOrderType = tpslOrder.stopOrderType;
      const symbol = tpslOrder.symbol;
      const positionIdx = tpslOrder.positionIdx;
      const qty = tpslOrder.leavesQty;

      if (symbol == order.coinName && positionIdx == order.positionIdx && qty == order.qty) {
        if (
          (stopOrderType == "PartialStopLoss" || stopOrderType == "StopLoss") &&
          tpslOrder.triggerPrice == signal.stopLoss
        ) {
          const res = await updateTPSLOrder(client, signal, tpslOrder.orderId, signal.entryPrice);

          if (!res.success) {
            await notificationController.createBybitError(res, user);
          }
        }
      }
    }
  }
};

// Close active position
const closePosition = async (user, coinName, side, qty, positionIdx) => {
  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const response = await client.submitOrder({
      category: "linear",
      symbol: coinName,
      side: side,
      orderType: "Market",
      qty: qty,
      positionIdx: positionIdx,
      reduceOnly: true,
    });

    if (response.retCode != 0) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true, data: response };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

// function to change the leverage
const changeLeverage = async (client, coinName, leverage) => {
  try {
    const response = await client.setLeverage({
      category: "linear",
      symbol: coinName,
      buyLeverage: leverage.toString(),
      sellLeverage: leverage.toString(),
    });

    if (response.retCode != 0 && response.retCode != 110043) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

export default {
  createTradeForMultipleUsers,
  cancelOrder,
  closePosition,
  updateTPSLManyUsers,
  cancelTradeAllUsers,
};
