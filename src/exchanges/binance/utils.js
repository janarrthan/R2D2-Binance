import Binance from "binance-api-node";
import BinanceError from "../../utils/BinanceError.js";

const client = Binance.default({});

const getCoinInfo = async (coinName, leverage) => {
  try {
    const res = await client.futuresExchangeInfo();
    const coin = res.symbols.find((symbol) => symbol.symbol == coinName);
    const marketPrice = await getCoinCurrentPrice(coinName);

    if (isNaN(marketPrice)) {
      throw new BinanceError("Coin market price not found!", 4);
    }

    if (!coin) {
      throw new BinanceError("Coin not found!", 4);
    }

    const priceFilter = coin.filters.find((filter) => filter.filterType == "PRICE_FILTER");
    const decimalPrecision = countDecimals(parseFloat(priceFilter.tickSize));

    const qtyFilter = coin.filters.find((filter) => filter.filterType == "LOT_SIZE");
    const notional = parseFloat(coin.filters.find((filter) => filter.filterType == "MIN_NOTIONAL").notional);
    const tempMinQty = notional / marketPrice;
    const minQty = roundUp(tempMinQty, countDecimals(qtyFilter.stepSize));

    const coinInfo = {
      coinName: coin.symbol,
      priceScale: decimalPrecision,
      qty: {
        minOrderQty: minQty,
        qtyStep: parseFloat(qtyFilter.stepSize),
      },
    };

    if (leverage) {
      coinInfo["leverage"] = leverage;
    }

    return coinInfo;
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }

  // {
  //   coinName: 'XRPUSDT',
  //   priceScale: '4',
  //   leverage: { minLeverage: '1', maxLeverage: '75.00', leverageStep: '0.01' },
  //   qty: {
  //     maxOrderQty: '1300000.0',
  //     minOrderQty: '0.1',
  //     qtyStep: '0.1',
  //     postOnlyMaxOrderQty: '1300000.0',
  //     maxMktOrderQty: '520000.0',
  //     minNotionalValue: '5'
  //   }
  // }
};

const tryGetCoinInfo = async (coinName, leverage) => {
  try {
    const res = await client.futuresExchangeInfo();
    const coin = res.symbols.find((symbol) => symbol.symbol == coinName);
    const marketPrice = await getCoinCurrentPrice(coinName);

    if (isNaN(marketPrice)) {
      return { error: "Invalid coin name. Could not find market price!" };
    }

    if (!coin) {
      return { error: "Invalid coin name. Could not find coin!" };
    }

    const priceFilter = coin.filters.find((filter) => filter.filterType == "PRICE_FILTER");
    const decimalPrecision = countDecimals(parseFloat(priceFilter.tickSize));

    const qtyFilter = coin.filters.find((filter) => filter.filterType == "LOT_SIZE");
    const notional = parseFloat(coin.filters.find((filter) => filter.filterType == "MIN_NOTIONAL").notional);
    const tempMinQty = notional / marketPrice;
    const minQty = roundUp(tempMinQty, countDecimals(qtyFilter.stepSize));

    const coinInfo = {
      coinName: coin.symbol,
      priceScale: decimalPrecision,
      qty: {
        minOrderQty: minQty,
        qtyStep: parseFloat(qtyFilter.stepSize),
      },
    };

    if (leverage) {
      coinInfo["leverage"] = leverage;
    }

    return coinInfo;
  } catch (er) {
    return { error: er.stack.toString() };
  }
};

const getTradeQty = (coinInfo, entryPrice, amountPerTrade) => {
  let qty = parseFloat(amountPerTrade / entryPrice);

  // check if the calculated qty is less than the minimum required qty
  if (qty < parseFloat(coinInfo.qty.minOrderQty)) {
    qty = parseFloat(coinInfo.qty.minOrderQty);
  }

  // check if qty has to be a whole number
  if (coinInfo.qty.qtyStep == 1) {
    qty = Math.round(qty);
  } else {
    qty = parseFloat(qty.toFixed(countDecimals(coinInfo.qty.qtyStep)));
  }

  return qty;
};

const getPricePrecision = async (coinName) => {
  try {
    const url = "https://fapi.binance.com/fapi/v1/exchangeInfo";

    const resp = await fetch(url);
    const data = await resp.json();
    const symbol = data.symbols.find((sym) => sym.symbol == coinName);

    if (symbol) {
      return { pricePrecision: symbol.pricePrecision };
    }

    return { error: "Invalid coin name. (Binance)" };
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

const getCoinCurrentPrice = async (coinName) => {
  try {
    const url = "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=" + coinName;

    const resp = await fetch(url);
    const data = await resp.json();
    return parseFloat(data.markPrice);
  } catch (error) {
    throw new BinanceError(error.message, 4);
  }
};

const countDecimals = (num) => {
  if (num == 1e-7) {
    if (0.0000001 % 1 != 0) {
      return "0.0000001".split(".")[1].length;
    }
  }

  if (parseFloat(num) % 1 != 0) {
    return num.toString().split(".")[1].length;
  }

  return 0;
};

function roundUp(num, decimalPlaces) {
  // Check if decimalPlaces is undefined, otherwise use 3 as default
  const factor = Math.pow(10, decimalPlaces !== undefined ? decimalPlaces : 3);
  return Math.ceil(num * factor) / factor;
}

export default {
  getCoinInfo,
  getPricePrecision,
  getCoinCurrentPrice,
  getTradeQty,
  tryGetCoinInfo,
};
