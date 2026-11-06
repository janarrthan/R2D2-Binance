import Binance from "binance-api-node";
import binanceUtils from "./utils.js";
import binanceAccount from "./account.js";

import notificationController from "../../controllers/notificationController.js";
import orderController from "../../controllers/orderController.js";
import btSignalController from "../../controllers/btSignalController.js";

// function to place a binance limit order
const placeOrder = async (client, signal, qty) => {
  try {
    // 1. Open Position
    const order = await client.futuresOrder({
      symbol: signal.coinName,
      side: signal.direction == "Long" ? "BUY" : "SELL",
      type: "LIMIT",
      quantity: qty,
      price: signal.entryPrice.toString(),
      timeInForce: "GTC",
      positionSide: signal.direction == "Long" ? "LONG" : "SHORT",
    });

    // 3. Set Stop Loss (SL) - Market Order
    const slOrder = await client.futuresOrder({
      symbol: signal.coinName,
      side: signal.direction == "Long" ? "SELL" : "BUY",
      type: "STOP_MARKET",
      stopPrice: signal.stopLoss.toString(),
      positionSide: signal.direction == "Long" ? "LONG" : "SHORT",
      quantity: qty,
    });

    const ids = {
      orderId: order.orderId,
      slId: slOrder.clientAlgoId,
    };

    return { success: true, ids: ids };
  } catch (error) {
    return { success: false, msg: error.stack.toString() };
  }
};

// function to place target profit
const placeTargetProfit = async (orders, signal) => {
  try {
    const positionSide = signal.direction == "Long" ? "LONG" : "SHORT";
    var isAllOrdersTPPlaced = true;

    for (var i = 0; i < orders.length; i++) {
      const order = orders[i];
      const user = order.userId;

      if (order.isTPSet) {
        continue;
      }

      const client = Binance.default({
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        hedgeMode: true,
      });

      const activePositions = await binanceAccount.getActivePostions(client);
      const trade = activePositions.data.find((pos) => pos.coinName == signal.coinName && pos.side == positionSide);

      if (!trade) {
        isAllOrdersTPPlaced = false;
        await notificationController.createBinanceError(
          {
            success: false,
            msg: `${signal.coinName} entry price hit but position is not found for placing target profit (Channel: ${signal.channel} ,MessageId: ${signal.messageId})`,
          },
          user,
        );
        continue;
      }

      // Set Take Profit (TP) - Market Order
      const tpOrder = await client.futuresOrder({
        symbol: signal.coinName,
        side: signal.direction == "Long" ? "SELL" : "BUY",
        type: "TAKE_PROFIT_MARKET",
        stopPrice: signal.targetPrice.toString(),
        positionSide: signal.direction == "Long" ? "LONG" : "SHORT",
        quantity: order.qty,
      });

      await orderController.updateById(order._id, { tpOrderId: tpOrder.clientAlgoId, isTPSet: true });
    }

    if (isAllOrdersTPPlaced) {
      await btSignalController.updateById(signal._id, { isTPSet: true });
    }

    return { success: true };
  } catch (error) {
    await notificationController.createNotif({
      message: error.stack.toString(),
      type: "Error",
    });
    return { success: false, msg: error.stack.toString() };
  }
};

// function to put trade for multiple users
const createTradeForMultipleUsers = async (signal, users) => {
  const coinInfo = await binanceUtils.getCoinInfo(signal.coinName);

  for (var i = 0; i < users.length; i++) {
    const user = users[i];
    const userStrategy = user.tradingStrategies.find(
      (str) => str.strategyId.toString() == signal.strategyId.toString(),
    );

    if (!userStrategy) {
      continue;
    }

    var qty = binanceUtils.getTradeQty(coinInfo, signal.entryPrice, userStrategy.strategyAmount);

    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const maxLeverage = await getMaxLeverage(client, signal.coinName);

    if (!maxLeverage.success) {
      await notificationController.createBinanceError(maxLeverage, user);
      continue;
    }

    const changeLevRes = await changeLeverage(client, signal.coinName, maxLeverage.data);

    if (!changeLevRes.success) {
      await notificationController.createBinanceError(changeLevRes, user);
      continue;
    }

    const response = await placeOrder(client, signal, qty);

    if (!response.success) {
      await notificationController.createBinanceError(response, user);
      continue;
    }

    const orderDetails = {
      signalId: signal._id,
      userId: user._id,
      orderId: response.ids.orderId,
      slOrderId: response.ids.slId,
      coinName: signal.coinName,
      qty: qty,
      positionSide: signal.direction == "Long" ? "LONG" : "SHORT",
    };

    await orderController.createOrder(orderDetails);
  }
};

// function to cancell order
const cancelOrder = async (coinName, client, orderId) => {
  try {
    const res = await client.futuresCancelBatchOrders({
      symbol: coinName,
      orderIdList: `[${orderId}]`,
    });

    return { success: true };
  } catch (error) {
    if (error.message == "Unknown order sent.") {
      return { success: true };
    }

    console.log(error);
    return { success: false, msg: error.stack.toString() };
  }
};

// function to cancell TP/SL order
const cancelTPSLOrder = async (coinName, client, orderId) => {
  try {
    const res = await client.futuresCancelAlgoOrder({
      symbol: coinName,
      clientAlgoId: orderId,
    });

    return { success: true };
  } catch (error) {
    if (error.message == "Unknown order sent.") {
      return { success: true };
    }
    return { success: false, msg: error.stack.toString() };
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

    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const orderRes = await cancelOrder(signal.coinName, client, order.orderId);
    const slOrderRes = await cancelTPSLOrder(signal.coinName, client, order.slOrderId);

    if (!orderRes.success) {
      await notificationController.createBinanceError(orderRes, user);
      continue;
    }

    if (!slOrderRes.success) {
      await notificationController.createBinanceError(slOrderRes, user);
      continue;
    }

    if (order.tpOrderId && order.tpOrderId != "") {
      const tpOrderRes = await cancelTPSLOrder(signal.coinName, client, order.tpOrderId);
      if (!tpOrderRes.success) {
        await notificationController.createBinanceError(tpOrderRes, user);
        continue;
      }
    }
  }
};

// function to cancell order (From Interface)
const cancelOrderCreateClient = async (coinName, user, orderId) => {
  try {
    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const res = await client.futuresCancelBatchOrders({
      symbol: coinName,
      orderIdList: `[${orderId}]`,
    });

    return { success: true };
  } catch (error) {
    if (error.message == "Unknown order sent.") {
      return { success: true };
    }

    return { success: false, msg: error.stack.toString() };
  }
};

// function to cancell TP/SL order (From Interface)
const cancelTPSLOrderCreateClient = async (coinName, user, orderId) => {
  try {
    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const res = await client.futuresCancelAlgoOrder({
      symbol: coinName,
      clientAlgoId: orderId,
    });

    return { success: true };
  } catch (error) {
    if (error.message == "Unknown order sent.") {
      return { success: true };
    }
    return { success: false, msg: error.stack.toString() };
  }
};

// function to cancell trades for single user (From Interface)
const cancelTradeSingleUser = async (coinName, user, order) => {
  const client = Binance.default({
    apiKey: user.apiKey,
    apiSecret: user.apiSecret,
    hedgeMode: true,
  });

  const orderRes = await cancelOrder(coinName, client, order.orderId);
  const slOrderRes = await cancelTPSLOrder(coinName, client, order.slOrderId);

  if (!orderRes.success) {
    return orderRes;
  }

  if (!slOrderRes.success) {
    return slOrderRes;
  }

  if (order.tpOrderId && order.tpOrderId != "") {
    const tpOrderRes = await cancelTPSLOrder(coinName, client, order.tpOrderId);
    if (!tpOrderRes.success) {
      return tpOrderRes;
    }
  }

  return { success: true };
};

// Update stop loss or target profit
const updateTPSLAlgoOrder = async (client, signal, order, tpPrice, slPrice) => {
  try {
    // 1. Remove existing TPSL orders
    const cancelSLResp = await cancelTPSLOrder(signal.coinName, client, order.slOrderId);
    if (!cancelSLResp.success) {
      return { success: false, msg: cancelSLResp.msg };
    }

    if (order.tpOrderId && order.tpOrderId != "") {
      const cancelTPResp = await cancelTPSLOrder(signal.coinName, client, order.tpOrderId);
      if (!cancelTPResp.success) {
        return { success: false, msg: cancelTPResp.msg };
      }
    }

    // 3. Set Stop Loss (SL) - Market Order
    const slOrder = await client.futuresOrder({
      symbol: signal.coinName,
      side: signal.direction == "Long" ? "SELL" : "BUY",
      type: "STOP_MARKET",
      stopPrice: slPrice,
      positionSide: signal.direction == "Long" ? "LONG" : "SHORT",
      quantity: order.qty,
    });

    const ids = {
      slId: slOrder.clientAlgoId,
    };

    if (order.tpOrderId && order.tpOrderId != "") {
      // 2. Set Take Profit (TP) - Market Order
      const tpOrder = await client.futuresOrder({
        symbol: signal.coinName,
        side: signal.direction == "Long" ? "SELL" : "BUY",
        type: "TAKE_PROFIT_MARKET",
        stopPrice: tpPrice,
        positionSide: signal.direction == "Long" ? "LONG" : "SHORT",
        quantity: order.qty,
      });

      ids["tpId"] = tpOrder.clientAlgoId;
    }

    return { success: true, ids: ids };
  } catch (error) {
    return { success: false, msg: error.stack.toString() };
  }
};

// Change TP/SL for many users
const updateTPSLManyUsers = async (signal, orders, tpPrice, slPrice) => {
  for (var i = 0; i < orders.length; i++) {
    const order = orders[i];
    const user = order.userId;

    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const resp = await updateTPSLAlgoOrder(client, signal, order, tpPrice, slPrice);

    if (!resp.success) {
      await notificationController.createBinanceError(resp, user);
      continue;
    }

    const updates = {
      slOrderId: resp.ids.slId,
    };

    if (resp.ids.tpId) {
      updates["tpOrderId"] = resp.ids.tpId;
    }

    await orderController.updateById(order._id, updates);
  }
};

// Close active position
const closePosition = async (user, coinName, direction, qty) => {
  try {
    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const resp = await client.futuresOrder({
      symbol: coinName,
      side: direction == "Long" ? "SELL" : "BUY",
      type: "MARKET",
      quantity: qty,
      positionSide: direction == "Long" ? "LONG" : "SHORT",
    });

    return { success: true, data: resp };
  } catch (error) {
    await notificationController.createBinanceError({ msg: error.stack.toString() }, user);
  }
};

// function to change the leverage
const changeLeverage = async (client, coinName, leverage) => {
  try {
    const result = await client.futuresLeverage({
      symbol: coinName,
      leverage: leverage,
    });

    return { success: true };
  } catch (error) {
    if (error.code == -4300) {
      return changeLeverage(client, coinName, 20);
    }

    if (error.code == -4421) {
      return changeLeverage(client, coinName, 5);
    }

    return { success: false, msg: error.stack.toString() };
  }
};

// Get MaxLeverage
const getMaxLeverage = async (client, coinName) => {
  try {
    const leverages = await client.futuresLeverageBracket();
    const coinLev = leverages.find((symbol) => symbol.symbol == coinName);
    const maxLeverage = coinLev.brackets.find((bracket) => bracket.bracket == 1).initialLeverage;

    return { success: true, data: maxLeverage };
  } catch (error) {
    return { success: false, msg: error.stack.toString() };
  }
};

export default {
  createTradeForMultipleUsers,
  cancelTradeAllUsers,
  updateTPSLManyUsers,
  closePosition,
  cancelTradeSingleUser,
  cancelOrderCreateClient,
  cancelTPSLOrderCreateClient,
  getMaxLeverage,
  placeTargetProfit,
};
