const calcProfit = (signal) => {
  if (signal.direction == "Long") {
    const profit = 100 * ((signal.targetPrice - signal.entryPrice) / signal.entryPrice);

    return profit.toFixed(2);
  } else if (signal.direction == "Short") {
    const profit = 100 * ((signal.entryPrice - signal.targetPrice) / signal.entryPrice);
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
  calcProfit,
  calcStopLoss,
};
