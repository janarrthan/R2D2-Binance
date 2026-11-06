import Binance from "binance-api-node";
import axios from "axios";
import crypto from "crypto";
import BinanceError from "../../utils/BinanceError.js";

const baseURL = "https://fapi.binance.com";

// For crypting the api keys and secret
const sign = (query, API_SECRET) => {
  return crypto.createHmac("sha256", API_SECRET).update(query).digest("hex");
};

// get account balance
const getAccountBalance = async (user) => {
  try {
    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const res = await client.futuresAccountBalance();
    const binanceBalance = res.find((bal) => bal.asset == "USDT");

    if (!binanceBalance) {
      return { success: false, msg: "Unable to fetch account balance!" };
    }

    const balance = {
      walletBalance: Math.round(parseFloat(binanceBalance.balance)),
      marginBalance: Math.round(parseFloat(binanceBalance.availableBalance)),
    };

    return { success: true, balance: balance };
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

// Fetch Positions
const getPostions = async (user) => {
  try {
    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const positions = await client.futuresPositionRisk();
    const activePositions = positions.filter((pos) => parseFloat(pos.positionAmt) !== 0);

    const activeTrades = [];

    activePositions.forEach((trade) => {
      activeTrades.push({
        coinName: trade.symbol,
        direction: trade.positionSide,
        createdTime: trade.updateTime,
        side: trade.positionSide,
        qty: Math.abs(parseFloat(trade.positionAmt)),
        positionAmt: Math.abs(parseFloat(trade.entryPrice) * parseFloat(trade.positionAmt)),
        unrealisedPnl: trade.unRealizedProfit,
        entryPrice: trade.entryPrice,
        takeProfit: "",
        stopLoss: "",
      });
    });

    return { success: true, data: activeTrades };
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

// Fetch Positions (Client is passed)
const getActivePostions = async (client) => {
  try {
    const positions = await client.futuresPositionRisk();
    const activePositions = positions.filter((pos) => parseFloat(pos.positionAmt) !== 0);

    const activeTrades = [];

    activePositions.forEach((trade) => {
      activeTrades.push({
        coinName: trade.symbol,
        direction: trade.positionSide,
        createdTime: trade.updateTime,
        side: trade.positionSide,
        qty: Math.abs(parseFloat(trade.positionAmt)),
        positionAmt: Math.abs(parseFloat(trade.entryPrice) * parseFloat(trade.positionAmt)),
        unrealisedPnl: trade.unRealizedProfit,
        entryPrice: trade.entryPrice,
        takeProfit: "",
        stopLoss: "",
      });
    });

    return { success: true, data: activeTrades };
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

// Fetch Open Orders
const getOpenOrders = async (user) => {
  try {
    const client = Binance.default({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      hedgeMode: true,
    });

    const response = await client.futuresOpenOrders();

    const trades = response.map((trade) => {
      return {
        orderId: trade.orderId,
        coinName: trade.symbol,
        side: trade.side,
        direction: trade.positionSide,
        createdTime: trade.updateTime,
        type: trade.type,
        stopPrice: trade.stopPrice,

        amount: trade.origQty,
        entryPrice: trade.price,
        takeProfit: trade.takeProfit,
        stopLoss: trade.stopLoss,
      };
    });

    return { success: true, data: trades };
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

const getOpenAlgoOrders = async (user) => {
  try {
    const timestamp = Date.now();

    const query = `timestamp=${timestamp}`;
    const signature = sign(query, user.apiSecret);

    const url = `${baseURL}/fapi/v1/openAlgoOrders?${query}&signature=${signature}`;

    const res = await axios.get(url, {
      headers: {
        "X-MBX-APIKEY": user.apiKey,
      },
    });

    const trades = res.data.map((trade) => {
      return {
        orderId: trade.clientAlgoId,
        coinName: trade.symbol,
        side: trade.side,
        direction: trade.positionSide,
        createdTime: trade.createTime,
        type: trade.orderType,
        stopPrice: trade.triggerPrice,
        amount: trade.quantity,

        entryPrice: trade.price,
        takeProfit: trade.takeProfit,
        stopLoss: trade.stopLoss,
      };
    });

    return { success: true, data: trades };
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

export default {
  getAccountBalance,
  getPostions,
  getOpenOrders,
  getOpenAlgoOrders,
  getActivePostions,
};
