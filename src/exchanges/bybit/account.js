import { RestClientV5 } from "bybit-api";
import BybitError from "../../utils/BybitError.js";

// get account balance
const getAccountBalance = async (user) => {
  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const response = await client.getWalletBalance({
      accountType: "UNIFIED",
      coin: "USDT",
    });

    if (response.retCode != 0) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    const balance = {
      walletBalance: Math.round(response.result.list[0].totalWalletBalance),
      marginBalance: Math.round(response.result.list[0].totalMarginBalance),
    };

    return { success: true, balance: balance };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

// Fetch Closed PnL
const fetchClosedPnL = async (client, startDate, endDate) => {
  const response = await client.getClosedPnL({
    category: "linear",
    startTime: startDate,
    endTime: endDate,
    limit: 100,
  });

  if (response.retCode != 0) {
    return { success: false, msg: response.retMsg, code: response.retCode };
  }

  var nextPage = response.result.nextPageCursor;
  var trades = response.result.list;
  var tempTrades = [...trades];

  while (nextPage && nextPage != "" && tempTrades.length > 100) {
    const reqRes = await client.getClosedPnL({
      category: "linear",
      cursor: nextPage,
      limit: 100,
    });

    trades.push(...reqRes.result.list);
    nextPage = reqRes.result.nextPageCursor;
    tempTrades = [...reqRes.result.list];
  }

  return { success: true, data: trades };
};

// Fetch Closed PnL for current month
const getClosedPnLForCurrentMonth = async (user) => {
  const date = new Date();
  var lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  var startDate = new Date(date.getFullYear(), date.getMonth(), 1).valueOf();
  var endDate = new Date(date.getFullYear(), date.getMonth(), lastDateOfMonth).valueOf();

  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const dayInMillSecs = 60 * 60 * 24 * 1000;
    endDate = endDate + dayInMillSecs;
    var tempStartDate = endDate - dayInMillSecs * 7; //23
    var tempEndDate = endDate; // 30
    var isTempStartEqualsStartDate = false;

    if (tempStartDate < startDate) {
      tempStartDate = startDate;
      isTempStartEqualsStartDate = true;
    }

    var trades = [];

    while (tempStartDate >= startDate) {
      const result = await fetchClosedPnL(client, tempStartDate, tempEndDate);

      if (!result.success) {
        return result;
      }

      trades.push(...result.data);

      const newTempStartDate = tempStartDate - dayInMillSecs * 7;
      tempEndDate = tempStartDate;
      tempStartDate = newTempStartDate;

      if (tempStartDate <= startDate && !isTempStartEqualsStartDate) {
        tempStartDate = startDate;
        isTempStartEqualsStartDate = true;
      }
    }

    const formattedTrades = trades.map((trade) => {
      return {
        symbol: trade.symbol,
        closedPnl: trade.closedPnl,
        closedTime: new Date(parseInt(trade.updatedTime)).toLocaleString(),
        openTime: new Date(parseInt(trade.createdTime)).toLocaleString(),
      };
    });

    var profit = 0;

    formattedTrades.forEach((trade) => {
      profit = profit + parseFloat(trade.closedPnl);
    });

    profit = profit.toFixed(2);

    return { success: true, data: { closedTrades: formattedTrades, profit: profit } };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

// Fetch Positions
const getPostions = async (user) => {
  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const response = await client.getPositionInfo({
      category: "linear",
      settleCoin: "USDT",
      limit: 100,
    });

    if (response.retCode != 0) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    const tpslOrdersResult = await getOpenTPSLOrders(user);

    if (!tpslOrdersResult.success) {
      return tpslOrdersResult;
    }

    const tpslOrders = tpslOrdersResult.data;

    const trades = response.result.list.map((trade) => {
      const stopLossOrder = tpslOrders.find(
        (order) => order.symbol == trade.symbol && order.stopOrderType == "PartialStopLoss" && order.qty == trade.size
      );
      const targetProfitOrder = tpslOrders.find(
        (order) => order.symbol == trade.symbol && order.stopOrderType == "PartialTakeProfit" && order.qty == trade.size
      );

      var takeProfit = trade.takeProfit.trim();
      var stopLoss = trade.stopLoss.trim();

      if (takeProfit == "" && targetProfitOrder) {
        takeProfit = targetProfitOrder.triggerPrice;
      }

      if (stopLoss == "" && stopLossOrder) {
        stopLoss = stopLossOrder.triggerPrice;
      }

      return {
        coinName: trade.symbol,
        direction: trade.side == "Sell" ? "Short" : "Long",
        createdTime: trade.createdTime,
        side: trade.side == "Sell" ? "Buy" : "Sell",
        qty: trade.size,
        positionValue: trade.positionValue,
        positionIdx: trade.positionIdx,
        unrealisedPnl: trade.unrealisedPnl,
        entryPrice: trade.avgPrice,
        takeProfit: takeProfit,
        stopLoss: stopLoss,
      };
    });

    return { success: true, data: trades };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

// Fetch Target And Stoploss Orders
const getOpenTPSLOrders = async (user) => {
  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const response = await client.getActiveOrders({
      category: "linear",
      settleCoin: "USDT",
      openOnly: 0,
      limit: 100,
      orderFilter: "StopOrder",
    });

    if (response.retCode != 0) {
      console.log(response);
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true, data: response.result.list };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

// Fetch Open Orders
const getOpenOrders = async (user) => {
  try {
    const client = new RestClientV5({
      key: user.apiKey,
      secret: user.apiSecret,
      options: { adjustForTimeDifference: true },
    });

    const response = await client.getActiveOrders({
      category: "linear",
      settleCoin: "USDT",
      openOnly: 0,
      limit: 50,
      orderFilter: "Order",
    });

    if (response.retCode != 0) {
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    const trades = response.result.list.map((trade) => {
      return {
        orderId: trade.orderId,
        coinName: trade.symbol,
        direction: trade.side == "Sell" ? "Short" : "Long",
        createdTime: trade.createdTime,
        amount: trade.leavesValue,
        entryPrice: trade.price,
        takeProfit: trade.takeProfit,
        stopLoss: trade.stopLoss,
      };
    });

    return { success: true, data: trades };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

// Get TP/SL order for symbol
const getTPSLOrdersForSymbol = async (client, coinName) => {
  try {
    const response = await client.getActiveOrders({
      category: "linear",
      symbol: coinName,
      openOnly: 0,
      limit: 50,
      orderFilter: "StopOrder",
    });

    if (response.retCode != 0) {
      console.log(response);
      return { success: false, msg: response.retMsg, code: response.retCode };
    }

    return { success: true, data: response.result.list };
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

export default {
  getAccountBalance,
  getClosedPnLForCurrentMonth,
  getPostions,
  getOpenOrders,
  getTPSLOrdersForSymbol,
};
