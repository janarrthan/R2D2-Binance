const updateInstruments = (prices) => {
  const latestPrices = {};

  prices.forEach(({ symbol, curDayClose }) => {
    latestPrices[symbol] = {};
    latestPrices[symbol]["price"] = parseFloat(curDayClose);
  });

  return latestPrices;
};

export default {
  updateInstruments,
};
