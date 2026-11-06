import notificationController from "../../controllers/notificationController.js";
import binanceUtils from "../../exchanges/binance/utils.js";

const checkSignalPricesValidity = async (tempTelSignal, channel) => {
  const tempSignalDirection = tempTelSignal.direction.trim().toLowerCase();
  const entryPrice = tempTelSignal.entryPrice;
  const targets = tempTelSignal.targets;
  const stoploss = tempTelSignal.stopLoss;
  const coinName = tempTelSignal.coinName;
  const coinCurrentPrice = await binanceUtils.getCoinCurrentPrice(coinName);

  var error = undefined;
  var warning = undefined;

  if (isNaN(coinCurrentPrice)) {
    error = `${tempTelSignal.coinName} invalid coin name. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
  } else {
    // Check for coin current price already hit targets or stoploss
    if (coinCurrentPrice && tempSignalDirection == "long") {
      if (coinCurrentPrice >= targets[targets.length - 1]) {
        error = `${tempTelSignal.coinName} targets already hit. \n \n 
              Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      } else if (coinCurrentPrice <= stoploss) {
        error = `${tempTelSignal.coinName} stoploss already hit. \n \n 
              Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }
    } else if (coinCurrentPrice && tempSignalDirection == "short") {
      if (coinCurrentPrice <= targets[targets.length - 1]) {
        error = `${tempTelSignal.coinName} targets already hit. \n \n 
              Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      } else if (coinCurrentPrice >= stoploss) {
        error = `${tempTelSignal.coinName} stoploss already hit. \n \n 
              Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }
    }
  }

  // Check for coin targets, entry and stoploss price validity
  if (tempSignalDirection == "long") {
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] < entryPrice) {
        error = `${tempTelSignal.coinName} entry price and targets have issues. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }

      if (targets[i] < stoploss) {
        error = `${tempTelSignal.coinName} stoploss price and targets have issues. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }

      if (i > 0 && targets[i] < targets[i - 1]) {
        error = `${tempTelSignal.coinName} targets have issues. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }
    }
  } else if (tempSignalDirection == "short") {
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] > entryPrice) {
        error = `${tempTelSignal.coinName} entry price and targets have issues. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }

      if (targets[i] > stoploss) {
        error = `${tempTelSignal.coinName} stoploss price and targets have issues. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }

      if (i > 0 && targets[i] > targets[i - 1]) {
        error = `${tempTelSignal.coinName} targets have issues. \n \n 
            Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
      }
    }
  }

  var profAlertPerc = channel.extractAlertsSettings.maxProfitPercAlert;
  var stopLossAlertPerc = channel.extractAlertsSettings.maxStoplossAlert;

  if (stopLossAlertPerc > 0) {
    stopLossAlertPerc = stopLossAlertPerc * -1;
  }

  if (profAlertPerc < 0) {
    stopLossAlertPerc = stopLossAlertPerc * -1;
  }

  const maxProfitPercentage = calcProfit(tempTelSignal);
  const stopLossPercetange = calcStopLoss(tempTelSignal);

  if (entryPrice == stoploss) {
    error = `${tempTelSignal.coinName} entry price and stoploss is same. \n \n  
    Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
  }

  if (maxProfitPercentage >= profAlertPerc) {
    warning = `${tempTelSignal.coinName} profit is ${maxProfitPercentage}%. \n \n  
    Which exceeds the alert profits % of ${profAlertPerc}. \n \n 
    Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
  }

  if (stopLossPercetange < stopLossAlertPerc) {
    warning = `${tempTelSignal.coinName} stoploss is ${stopLossPercetange}%. \n \n  
      Which exceeds the alert profits % of ${stopLossAlertPerc}. \n \n 
      Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
  }

  if (targets.length <= channel.extractAlertsSettings.minNumOfTargetsAlert) {
    warning = `${tempTelSignal.coinName} has only ${targets.length} targets.
    \n \n Which is less than or equal to the minimum number of targets alert of ${channel.extractAlertsSettings.minNumOfTargetsAlert}.
    \n \n Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
  }

  if (channel.extractAlertsSettings.coinNameAlert) {
    const coinsAlertList = channel.extractAlertsSettings.coinNameAlert
      .split(",")
      .map((coin) => coin.trim().toLowerCase());

    if (coinsAlertList.includes(tempTelSignal.coinName.toLowerCase())) {
      warning = `${tempTelSignal.coinName} is in the coin alerts list. \n \n  
      Message ID: ${tempTelSignal.messageId}. Channel: ${channel.channelName}`;
    }
  }

  if (error) {
    const notif = await notificationController.createNotif({
      message: error,
      type: "error",
    });

    return notif;
  }

  if (warning) {
    const notif = await notificationController.createNotif({
      message: warning,
      type: "warning",
    });

    return notif;
  }

  return undefined;
};

const calcProfit = (signal) => {
  const targetPrice = signal.targets[signal.targets.length - 1];

  if (signal.direction == "Long") {
    const profit = 100 * ((targetPrice - signal.entryPrice) / signal.entryPrice);

    return profit.toFixed(2);
  } else if (signal.direction == "Short") {
    const profit = 100 * ((signal.entryPrice - targetPrice) / signal.entryPrice);
    return profit.toFixed(2);
  }
};

const calcStopLoss = (signal) => {
  if (signal.direction == "Long") {
    const loss = 100 * ((signal.entryPrice - signal.stopLoss) / signal.entryPrice);
    return loss.toFixed(2) * -1;
  } else if (signal.direction == "Short") {
    const loss = 100 * ((signal.stopLoss - signal.entryPrice) / signal.entryPrice);

    return loss.toFixed(2) * -1;
  }
};

export default {
  checkSignalPricesValidity,
};
