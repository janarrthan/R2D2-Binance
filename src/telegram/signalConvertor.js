import strategyController from "../controllers/strategyController.js";
import notificationController from "../controllers/notificationController.js";
import binanceUtils from "../exchanges/binance/utils.js";
import dateFormat from "../utils/dateFormat.js";

const convertSignal = async (channel, telSignal, repeatedSignals) => {
  const strategies = await strategyController.find({ channel: channel._id, status: "Active" });
  const signals = [];

  const date = new Date();
  const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const messageDateTime = dateFormat.convertTZ(telSignal.dateAdded, "Asia/Colombo");
  const messageDate = messageDateTime.getDate();
  const messageDay = messageDateTime.getDay();
  const binanceResult = await binanceUtils.tryGetCoinInfo(telSignal.coinName);

  if (binanceResult.error) {
    const errorMsg = `${binanceResult.error} \n Message Id: ${telSignal.messageId}. \n Channel: ${channel.channelName}`;
    await notificationController.createNotif({ message: errorMsg, type: "error" });
  }

  if (binanceResult.error) {
    return [];
  }

  strategies.forEach((strategy) => {
    var signal = undefined;

    if (strategy.type == "NTS" && strategy.strategyFor == telSignal.direction) {
      signal = convertNTS(strategy, channel, telSignal, messageDate, messageDay, lastDateOfMonth);
    } else if (strategy.type == "OTS" && strategy.strategyFor == telSignal.direction) {
      signal = convertOTS(strategy, channel, telSignal, messageDate, messageDay, lastDateOfMonth);
    } else if (strategy.type == "PENTS" && strategy.strategyFor == telSignal.direction) {
      signal = convertPENTS(strategy, channel, telSignal, messageDate, messageDay, lastDateOfMonth);
    }

    if (signal) {
      const bybitSignal = convertDecimalPrecision({ ...signal }, binanceResult.priceScale);
      bybitSignal.messageId = telSignal.messageId;
      signals.push(bybitSignal);
    }
  });

  return signals;
};

const convertNTS = (strategy, channel, telSignal, messageDate, messageDay, lastDateOfMonth) => {
  const excludedDays = strategy.excludedDays;
  const excludedDates = formatExcludedDates(strategy.excludedDates, lastDateOfMonth);
  const isExcludeRepeatedSign = strategy.isExclRepeatTrades;

  if (excludedDates.includes(messageDate) || excludedDays.includes(messageDay)) {
    return undefined;
  }

  if (isExcludeRepeatedSign && telSignal.isRepeatedSignal) {
    return undefined;
  }

  var targetPrice = undefined;
  var isStopLossMvToEntry = false;
  var strategyType = strategy.strategyType;
  var cancelTarget = telSignal.targets[telSignal.targets.length - 1];

  if (telSignal.targets.length >= strategy.selectedTargetNo) {
    targetPrice = telSignal.targets[strategy.selectedTargetNo - 1];
  } else if (strategy.isPlaceTradeIfTargetDoesntExist) {
    targetPrice = telSignal.targets[telSignal.targets.length - 1];
  }

  if (telSignal.targets.length >= strategy.tradeCancelTargetNo) {
    cancelTarget = telSignal.targets[strategy.tradeCancelTargetNo - 1];
  }

  if (strategyType == "stopLossMoveToEntry") {
    isStopLossMvToEntry = true;
  }

  if (targetPrice) {
    var signal = {
      strategyId: strategy._id,
      telegramSignalId: telSignal._id,
      coinName: telSignal.coinName,
      direction: strategy.strategyFor,
      entryPrice: telSignal.entryPrice,
      stopLoss: telSignal.stopLoss,
      targetPrice: targetPrice,
      dateAdded: telSignal.dateAdded,
      channel: telSignal.channel,
      isStopLossMvToEntry: isStopLossMvToEntry,
      cancelTarget: cancelTarget,
      mainStrategy: strategy.type,
      strategy: strategyType,
    };

    if (signal.isStopLossMvToEntry) {
      signal.stopLossMvPrice = telSignal.targets[0];
    }

    return signal;
  }

  return undefined;
};

const convertOTS = (strategy, channel, telSignal, messageDate, messageDay, lastDateOfMonth) => {
  const excludedDays = strategy.excludedDays;
  const excludedDates = formatExcludedDates(strategy.excludedDates, lastDateOfMonth);
  const isExcludeRepeatedSign = strategy.isExclRepeatTrades;

  if (excludedDates.includes(messageDate) || excludedDays.includes(messageDay)) {
    return undefined;
  }

  if (isExcludeRepeatedSign && telSignal.isRepeatedSignal) {
    return undefined;
  }

  var entryPrice = undefined;
  var stopLoss = undefined;
  var targetPrice = telSignal.stopLoss;
  var isStopLossMvToEntry = false;
  var strategyType = strategy.strategyType;
  var direction = undefined;

  if (strategyType == "stopLossMoveToEntry") {
    isStopLossMvToEntry = true;
  }

  if (strategyType == "tpEntry") {
    targetPrice = telSignal.entryPrice;
  }

  if (strategyType == "normal" && strategy.selectedEntryTargetNo == 0) {
    entryPrice = telSignal.entryPrice;
  } else if (telSignal.targets.length >= strategy.selectedEntryTargetNo) {
    entryPrice = telSignal.targets[strategy.selectedEntryTargetNo - 1];
  }

  if (telSignal.targets.length >= strategy.selectedStoplossTargetNo) {
    stopLoss = telSignal.targets[strategy.selectedStoplossTargetNo - 1];
  } else if (telSignal.targets.length > strategy.selectedEntryTargetNo) {
    stopLoss = telSignal.targets[telSignal.targets.length - 1];
  }

  if (strategy.strategyFor == "Long") {
    direction = "Short";
  } else if (strategy.strategyFor == "Short") {
    direction = "Long";
  }

  if (entryPrice && stopLoss) {
    var signal = {
      strategyId: strategy._id,
      telegramSignalId: telSignal._id,
      coinName: telSignal.coinName,
      direction: direction,
      entryPrice: entryPrice,
      stopLoss: stopLoss,
      targetPrice: targetPrice,
      dateAdded: telSignal.dateAdded,
      channel: telSignal.channel,
      isStopLossMvToEntry: isStopLossMvToEntry,
      cancelTarget: telSignal.stopLoss,
      mainStrategy: strategy.type,
      strategy: strategyType,
    };

    if (signal.isStopLossMvToEntry) {
      signal.stopLossMvPrice = telSignal.entryPrice;
    }

    return signal;
  }

  return undefined;
};

const convertPENTS = (strategy, channel, telSignal, messageDate, messageDay, lastDateOfMonth) => {
  const excludedDays = strategy.excludedDays;
  const excludedDates = formatExcludedDates(strategy.excludedDates, lastDateOfMonth);
  const isExcludeRepeatedSign = strategy.isExclRepeatTrades;

  if (excludedDates.includes(messageDate) || excludedDays.includes(messageDay)) {
    return undefined;
  }

  if (isExcludeRepeatedSign && telSignal.isRepeatedSignal) {
    return undefined;
  }

  var targetPrice = undefined;
  var isStopLossMvToEntry = false;
  var strategyType = strategy.strategyType;
  var cancelTarget = telSignal.targets[telSignal.targets.length - 1];

  if (telSignal.targets.length >= strategy.selectedTargetNo) {
    targetPrice = telSignal.targets[strategy.selectedTargetNo - 1];
  } else if (strategy.isPlaceTradeIfTargetDoesntExist) {
    targetPrice = telSignal.targets[telSignal.targets.length - 1];
  }

  if (telSignal.targets.length >= strategy.tradeCancelTargetNo) {
    cancelTarget = telSignal.targets[strategy.tradeCancelTargetNo - 1];
  }

  if (strategyType == "stopLossMoveToEntry") {
    isStopLossMvToEntry = true;
  }

  if (targetPrice) {
    var signal = {
      strategyId: strategy._id,
      telegramSignalId: telSignal._id,
      coinName: telSignal.coinName,
      direction: strategy.strategyFor,
      entryPrice: getDiffEntryPrice(telSignal.entryPrice, telSignal.stopLoss, strategy.selectedEntryPerc),
      stopLoss: telSignal.stopLoss,
      targetPrice: targetPrice,
      dateAdded: telSignal.dateAdded,
      channel: telSignal.channel,
      isStopLossMvToEntry: isStopLossMvToEntry,
      cancelTarget: cancelTarget,
      mainStrategy: strategy.type,
      strategy: strategyType,
    };

    if (signal.isStopLossMvToEntry) {
      signal.stopLossMvPrice = telSignal.targets[0];
    }

    return signal;
  }

  return undefined;
};

const formatExcludedDates = (excludedDates, lastDateOfMonth) => {
  if (excludedDates.length == 0) {
    return [];
  }

  const arr = [];

  for (var i = 0; i < excludedDates.length; i++) {
    const date = parseInt(excludedDates[i]);

    if (date == 100) {
      arr.push(lastDateOfMonth);
    } else {
      arr.push(date);
    }
  }

  return arr;
};

const getDiffEntryPrice = (entryPrice, stopLoss, percentage) => {
  const initialLossPercent = 100 * ((entryPrice - stopLoss) / entryPrice);
  const entryPercentageNew = initialLossPercent * (percentage / 100);
  const entryPriceNew = entryPrice - (entryPrice * entryPercentageNew) / 100;
  return entryPriceNew;
};

const convertDecimalPrecision = (signal, decimalPrecision) => {
  signal.entryPrice = parseFloat(signal.entryPrice.toFixed(decimalPrecision));
  signal.stopLoss = parseFloat(signal.stopLoss.toFixed(decimalPrecision));
  signal.targetPrice = parseFloat(signal.targetPrice.toFixed(decimalPrecision));

  return signal;
};

export default {
  convertSignal,
};
