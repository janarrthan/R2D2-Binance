// import Binance from "node-binance-api";
import Binance from "binance-api-node";
import TelegramConnection from "./telegram/telegram.js";
import TelegramMcuteCon from "./telegram/telegram-mtcute.js";

import telAccountController from "./controllers/telegramAccountController.js";
import btSignalController from "./controllers/btSignalController.js";
import telegramSigController from "./controllers/telegramSigController.js";
import orderController from "./controllers/orderController.js";
import channelController from "./controllers/channelController.js";
import notificationController from "./controllers/notificationController.js";
import PriceAlert from "./models/priceAlert.js";
import priceAlertLogic from "./alerts/priceAlertLogic.js";
import TimeKeeper from "./models/timeKeeper.js";
import playAlert from "./utils/playAlert.js";

import cryptoExchangeTrade from "./exchanges/binance/trade.js";
import profitLoss from "./utils/profit_loss_calc.js";
import binanceUtils from "./binance/utils.js";

// Global Variables
global.telAccounts = {};

// Data variables
var unfilteredCoinPrices = [];
var coinsCurrentPrices = {};
var timeKeeperId = undefined;
var lastPriceUpdatedTime = undefined;
var currentPriceUpdatedTime = undefined;
const threeMinutesInMs = 3 * 60 * 1000;

const start = async () => {
  try {
    await startMcuteTelegram();
    await startTelegram();

    const binance = Binance.default();
    binance.ws.futuresAllTickers((tickers) => {
      unfilteredCoinPrices = tickers;
      currentPriceUpdatedTime = Date.now();
    });

    const timeKeeper = await TimeKeeper.find({});

    if (timeKeeper && timeKeeper.length > 0) {
      timeKeeperId = timeKeeper[0]._id;
    }

    startChecking();
    startPriceAlertChecking();
    startCandleStickChecking();
  } catch (error) {
    console.log("================ Error =================");
    console.log(error);
    playAlert();
    await notificationController.createAppError(error.stack.toString());
  }
};

const startTelegram = async () => {
  const accounts = await telAccountController.getAccountsWithActiveChannels();

  for (var i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const telegramAccount = new TelegramConnection(account.apiId, account.apiHash, account.accountName, account._id);

    // await telegramAccount.start();
    global.telAccounts["acc-" + account._id] = telegramAccount;
    // telegramAccount.listen(account.channels.map((channel) => channel.channelId));
  }
};

const startMcuteTelegram = async () => {
  const accounts = await telAccountController.getAccountsWithActiveChannels();

  for (var i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const telegramAccount = new TelegramMcuteCon(account.apiId, account.apiHash, account.accountName, account._id);

    await telegramAccount.start();
    const chatIds = account.channels.map((channel) => parseInt("-100" + channel.channelId.toString()));
    telegramAccount.listen(chatIds);
  }
};

const startChecking = async () => {
  const btSignals = await btSignalController.findMany({ status: "Active" });

  if (!unfilteredCoinPrices || unfilteredCoinPrices.length == 0) {
    await notificationController.createAppError("No coin prices received from Binance.");
  }

  if (lastPriceUpdatedTime == currentPriceUpdatedTime) {
    const diff = Date.now() - currentPriceUpdatedTime;
    if (diff > threeMinutesInMs) {
      await notificationController.createAppError("No new coin prices received from Binance.");
    }
  }

  lastPriceUpdatedTime = currentPriceUpdatedTime;

  const unfilteredPrices = [...unfilteredCoinPrices];
  coinsCurrentPrices = binanceUtils.updateInstruments(unfilteredPrices);

  // check if prices hit
  for (var i = 0; i < btSignals.length; i++) {
    const signal = btSignals[i];
    const coin = coinsCurrentPrices[signal.coinName];

    if (coin) {
      const direction = signal.direction;
      const entryPrice = signal.entryPrice;
      const isEntry = signal.isEntry;
      const targetPrice = signal.targetPrice;
      const stopLoss = signal.stopLoss;
      const isStopLossMvToEntry = signal.isStopLossMvToEntry;
      const stopLossMvPrice = signal.stopLossMvPrice;
      const didMoveSLToEntry = signal.didMoveSLToEntry;
      const cancelTarget = signal.cancelTarget;
      const mainStrategy = signal.mainStrategy;
      const strategy = signal.strategy;

      // Check if entry price reached
      if (!isEntry) {
        if (isEntryHit(direction, coin.price, entryPrice)) {
          // Update signal isEntry to true
          await btSignalController.updateById(signal._id, { isEntry: true });
        }
      }

      // Set Target Profit
      if (isEntry || isEntryHit(direction, coin.price, entryPrice)) {
        if (!signal.isTPSet) {
          const orders = await orderController.findOrdersWithUsersFullDetails({
            signalId: signal._id,
          });

          await cryptoExchangeTrade.placeTargetProfit(orders, signal);
        }
      }

      // Check if need to move SL to entry for stop loss move to entry strategy
      if (strategy == "stopLossMoveToEntry" && isEntry && isStopLossMvToEntry && !didMoveSLToEntry) {
        if (isStopLossMovePriceHit(direction, coin.price, stopLossMvPrice)) {
          // Update stop loss price to entry
          const orders = await orderController.findOrdersWithUsersFullDetails({
            signalId: signal._id,
          });
          await cryptoExchangeTrade.updateTPSLManyUsers(signal, orders, targetPrice, entryPrice);
          await btSignalController.updateById(signal._id, { didMoveSLToEntry: true });
        }
      }

      // Check if moved stop loss hit
      if (isEntry && isStopLossMvToEntry && didMoveSLToEntry) {
        if (isStopLossHit(direction, coin.price, entryPrice)) {
          const { telReplyAccount, channel } = await getTelReplyDetails(signal.channel);

          await telReplyAccount.sendClosedOnEntryReplyStartAndClose(channel.replyToChannelId, signal);

          await cryptoExchangeTrade.cancelTradeAllUsers(signal);
          await orderController.deleteMany(signal._id);
          await btSignalController.deleteById(signal._id);
        }
      }

      // Check if Stop Loss Hit
      if (isStopLossHit(direction, coin.price, stopLoss)) {
        const { telReplyAccount, channel } = await getTelReplyDetails(signal.channel);
        const loss = profitLoss.calcStopLoss(signal);

        // Send Telegram stop loss hit message
        await telReplyAccount.sendStopLossReplyStartAndClose(channel.replyToChannelId, signal, loss);

        await cryptoExchangeTrade.cancelTradeAllUsers(signal);
        await processCompletedTrades(signal);
      }

      // Check if profit Hit
      else if (isProfitHit(direction, coin.price, targetPrice)) {
        const { telReplyAccount, channel } = await getTelReplyDetails(signal.channel);

        if (isEntry) {
          var profit = profitLoss.calcProfit(signal);
          profit = parseFloat(profit).toFixed(3);

          await telReplyAccount.sendProfitHitReplyStartAndClose(channel.replyToChannelId, signal, profit);
          await cryptoExchangeTrade.cancelTradeAllUsers(signal);
          await processCompletedTrades(signal);
        } else if (isProfitHit(direction, coin.price, cancelTarget)) {
          // Cancell the trades
          await cryptoExchangeTrade.cancelTradeAllUsers(signal);

          // Send Telegram trade cancelled message
          await telReplyAccount.sendTradeCancelledReplyStartAndClose(channel.replyToChannelId, signal);

          await processCompletedTrades(signal);
        }
      }
    }
  }

  if (timeKeeperId) {
    await TimeKeeper.findByIdAndUpdate(timeKeeperId, { lastActive: new Date() });
  }

  setTimeout(() => {
    startChecking();
  }, 1000);
};

const startPriceAlertChecking = async () => {
  const alerts = await PriceAlert.find({});

  if (alerts && alerts.length > 0) {
    const unfilteredPrices = [...unfilteredCoinPrices];
    coinsCurrentPrices = binanceUtils.updateInstruments(unfilteredPrices);

    for (var i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const currentPrice = coinsCurrentPrices[alert.coinName];

      if (currentPrice && currentPrice.price) {
        await priceAlertLogic.checkPriceAlert(currentPrice.price, alert);
      }
    }
  }

  setTimeout(() => {
    startPriceAlertChecking();
  }, 1000);
};

const startCandleStickChecking = async () => {
  const btSignals = await btSignalController.findMany({ status: "Active" }, "channel");

  const binance = Binance.default();

  for (var i = 0; i < btSignals.length; i++) {
    const signal = btSignals[i];
    const signalDirection = signal.direction;
    const signalDateTime = new Date(signal.dateAdded).getTime();
    const startTime = signalDateTime - 60 * 60 * 1000;

    const candles = await binance.futuresCandles({
      symbol: signal.coinName,
      interval: "1h",
      limit: 1000,
      startTime: startTime,
    });

    for (var j = 0; j < candles.length; j++) {
      const candle = candles[j];
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      var isCandleEntry = false;

      if (signalDirection == "Long") {
        if (!isCandleEntry && low <= signal.entryPrice) {
          isCandleEntry = true;
        }

        if (low <= signal.stopLoss) {
          const message = `Stop Loss Hit but trade is active : ${signal.coinName} - ${signal.messageId} - ${signal.channel.channelName}`;
          await notificationController.createAppError(message);
          break;
        } else if (signal.isEntry && isCandleEntry && high >= signal.targetPrice) {
          const message = `Target Price Hit but trade is active : ${signal.coinName} - ${signal.messageId} - ${signal.channel.channelName}`;
          await notificationController.createAppError(message);
          break;
        } else if (high >= signal.cancelTarget) {
          const message = `Cancel Target Hit but trade is active : ${signal.coinName} - ${signal.messageId} - ${signal.channel.channelName}`;
          await notificationController.createAppError(message);
          break;
        }
      }

      if (signalDirection == "Short") {
        if (!isCandleEntry && high >= signal.entryPrice) {
          isCandleEntry = true;
        }

        if (high >= signal.stopLoss) {
          const message = `Stop Loss Hit but trade is active : ${signal.coinName} - ${signal.messageId} - ${signal.channel.channelName}`;
          await notificationController.createAppError(message);
          break;
        } else if (signal.isEntry && isCandleEntry && low <= signal.targetPrice) {
          const message = `Target Price Hit but trade is active : ${signal.coinName} - ${signal.messageId} - ${signal.channel.channelName}`;
          await notificationController.createAppError(message);
          break;
        } else if (low <= signal.cancelTarget) {
          const message = `Cancel Target Hit but trade is active : ${signal.coinName} - ${signal.messageId} - ${signal.channel.channelName}`;
          await notificationController.createAppError(message);
          break;
        }
      }
    }
  }

  setTimeout(() => {
    startCandleStickChecking();
  }, 300000);
};

//  ===================================== UTILITY FUNCTIONS =============================

const isEntryHit = (direction, coinPrice, entryPrice) => {
  if (direction == "Long" && coinPrice <= entryPrice) {
    return true;
  } else if (direction == "Short" && coinPrice >= entryPrice) {
    return true;
  }

  return false;
};

const isStopLossMovePriceHit = (direction, coinPrice, stopLossMvPrice) => {
  if (direction == "Long" && coinPrice >= stopLossMvPrice) {
    return true;
  } else if (direction == "Short" && coinPrice <= stopLossMvPrice) {
    return true;
  }

  return false;
};

const isStopLossHit = (direction, coinPrice, stopLoss) => {
  if (direction == "Long" && coinPrice <= stopLoss) {
    return true;
  } else if (direction == "Short" && coinPrice >= stopLoss) {
    return true;
  }

  return false;
};

const isProfitHit = (direction, coinPrice, targetPrice) => {
  if (direction == "Long" && coinPrice >= targetPrice) {
    return true;
  } else if (direction == "Short" && coinPrice <= targetPrice) {
    return true;
  }

  return false;
};

const getTelReplyDetails = async (channelId) => {
  const channel = await channelController.findById(channelId);
  const telReplyAccount = global.telAccounts["acc-" + channel.replyToChannelAccount];

  return {
    channel: channel,
    telReplyAccount: telReplyAccount,
  };
};

const processCompletedTrades = async (signal) => {
  await orderController.deleteMany(signal._id);
  await btSignalController.deleteById(signal._id);
  await telegramSigController.deleteSignal(signal.telegramSignalId);
};

export default {
  start,
};
