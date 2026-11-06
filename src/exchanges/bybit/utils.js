import { RestClientV5 } from "bybit-api";
import BybitError from "../../utils/BybitError.js";

const client = new RestClientV5({});

const getCoinInfo = async (coinName) => {
  try {
    const response = await client.getInstrumentsInfo({
      category: "linear",
      symbol: coinName,
    });

    if (response.retCode != "0") {
      throw new BybitError(response.retMsg, 4);
    }

    const coinInfo = {
      coinName: coinName,
      priceScale: response.result.list[0].priceScale,
      leverage: response.result.list[0].leverageFilter,
      qty: response.result.list[0].lotSizeFilter,
    };

    return coinInfo;
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

const getCoinCurrentPrice = async (coinName) => {
  try {
    const response = await client.getTickers({
      category: "linear",
      symbol: coinName,
    });

    if (response.retCode != "0") {
      return {error: response.retMsg};
    }

    if (response.result.list[0]) {
      return response.result.list[0].lastPrice;
    }

    return {error: "Invalid coinname"};
  } catch (error) {
    throw new BybitError(error.message, 4);
  }
};

const tryGetCoinInfo = async (coinName) => {
  try {
    const response = await client.getInstrumentsInfo({
      category: "linear",
      symbol: coinName,
    });

    if (response.retCode == "10001") {
      return { error: "Invalid coin name. (Bybit)" };
    }

    if (response.retCode != "0") {
      return { error: response.retMsg + " (Bybit)" };
    }

    if (response.result.list[0].status == "Closed") {
      return { error: "Coin is not tradable anymore. (Bybit)" };
    }

    const coinInfo = {
      coinName: coinName,
      priceScale: response.result.list[0].priceScale,
      leverage: response.result.list[0].leverageFilter,
      qty: response.result.list[0].lotSizeFilter,
    };

    return coinInfo;
  } catch (error) {
    throw new BybitError(error.message, 4);
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

const getTradeQtyForMultiTargets = (coinInfo, signal, amountPerTrade) => {
  const noOfTargets = signal.targets.length;
  const amountPerTarget = parseFloat(amountPerTrade) / noOfTargets;
  var qtyPerTarget = amountPerTarget / parseFloat(signal.entryPrice);
  var qty = qtyPerTarget * noOfTargets;

  if (qtyPerTarget < parseFloat(coinInfo.qty.minOrderQty)) {
    qtyPerTarget = parseFloat(coinInfo.qty.minOrderQty);
    qty = qtyPerTarget * noOfTargets;
  }

  // check if qty has to be a whole number
  if (coinInfo.qty.qtyStep == 1) {
    qty = Math.round(qtyPerTarget) * noOfTargets;
  } else {
    const tempQtyPerTarget = parseFloat(qtyPerTarget.toFixed(countDecimals(coinInfo.qty.qtyStep)));
    qty = tempQtyPerTarget * noOfTargets;
  }

  return qty;
};

const countDecimals = (num) => {
  if (parseFloat(num) % 1 != 0) {
    return num.toString().split(".")[1].length;
  }

  return 0;
};

export default {
  getCoinInfo,
  getTradeQty,
  getTradeQtyForMultiTargets,
  tryGetCoinInfo,
  getCoinCurrentPrice,
};
