import telegramSignalController from "../controllers/telegramSigController.js";
import btSignalController from "../controllers/btSignalController.js";
import userController from "../controllers/userController.js";
import notificationController from "../controllers/notificationController.js";

import cryptoExchange from "../exchanges/binance/trade.js";
import signalExtractorObj from "./extractor/signal-extractor.js";
import extractUtils from "./extractor/extractUtils.js";
import signalConvertor from "./signalConvertor.js";
import playAlert from "../utils/playAlert.js";

const signalExtractor = signalExtractorObj.extractSignal;

// ========================== Common Functions ===============================
const handleMessage = async (event, channel, isCreateSignal = true, isSendMessage = true, isCreateTrade = true) => {
  const telSignal = signalExtractor(event, channel);

  if (!telSignal) {
    return;
  }

  if (telSignal.error) {
    return await notificationController.createNotif({
      message: telSignal.error,
      type: "error",
    });
  }

  const notif = await extractUtils.checkSignalPricesValidity(telSignal, channel);

  if (notif && notif.type == "error") {
    return;
  }

  console.log(channel.channelName);
  console.log(telSignal);
  const result = await processTelegramSignal(telSignal, channel);
  console.log("=================================");

  if (channel.channelId == 1576512030) {
    playAlert();
  }

  return;

  if (!result) {
    return;
  }

  // 1 -> Convert Signal
  const signals = await signalConvertor.convertSignal(channel, result.telSignal, result.repeatedSignals);
  // 2 -> Process Converted Signal
  await processSignal(signals, channel, isCreateSignal, isSendMessage, isCreateTrade);
};

const processSignal = async (
  tempSignals,
  channel,
  isCreateSignal = true,
  isSendMessage = true,
  isCreateTrade = true,
) => {
  if (isCreateSignal) {
    if (tempSignals.length == 0) {
      return;
    }

    if (isSendMessage) {
      for (var i = 0; i < tempSignals.length; i++) {
        const tempSignal = tempSignals[i];
        const directionEmoji = tempSignal.direction == "Long" ? "🟢🟢🟢" : "🔴🔴🔴";
        const direction = tempSignal.direction;
        const coinName = tempSignal.coinName;

        const title = `${direction} ${directionEmoji} - Futures ${coinName} (Stop Market Trade) \n \n`;
        const entryLine = `Entry Price: ${tempSignal.entryPrice} \n \n`;
        const stopLoss = `Stop Loss: ${tempSignal.stopLoss}`;

        var targets = `Target Price: ${tempSignal.targetPrice} \n \n`;

        if (tempSignal.strategy == "mv-sl-to-entry-take-prof-each-tp") {
          targets = `Targets: ${tempSignal.targets.toString().replaceAll(",", " - ")} \n \n`;
        }

        const message = `${title} ${entryLine} ${targets} ${stopLoss}`;
        const telAccount = global.telAccounts["acc-" + channel.replyToChannelAccount];
        tempSignal.telegramOutgoingMsgId = await telAccount.startAndSendMessage(channel, message);
      }
    }

    const signals = await btSignalController.createMultipleSignals(tempSignals);

    if (isCreateTrade) {
      const users = await userController.getActiveUsers(channel._id);

      for (var i = 0; i < signals.length; i++) {
        const signal = signals[i];
        await cryptoExchange.createTradeForMultipleUsers(signal, users);
      }
    }
  }
};

const processTelegramSignal = async (tempTelSignal) => {
  if (!tempTelSignal) {
    return undefined;
  }

  const isDuplicateSignal = await telegramSignalController.isDuplicateSignal(tempTelSignal);

  console.log("isDuplicateSignal: ", isDuplicateSignal);

  if (isDuplicateSignal) {
    return undefined;
  }

  const repeatedSignals = await telegramSignalController.findRepeatedSignals(tempTelSignal);

  console.log("repeatedSignals: ", repeatedSignals);

  if (repeatedSignals.length > 0) {
    tempTelSignal.isRepeatedSignal = true;
    tempTelSignal.repeatedSignalOf = repeatedSignals.map((sig) => sig.messageId);
  }

  const telSignal = await telegramSignalController.createSignal(tempTelSignal);

  return {
    telSignal: telSignal,
    repeatedSignals: repeatedSignals,
  };
};

export default {
  processSignal,
  processTelegramSignal,
  handleMessage,
};
