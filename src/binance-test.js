import "dotenv/config";
import Binance from "binance-api-node";
import binanceUtils from "./exchanges/binance/utils.js";

// Authenticated client, can make signed calls
const binance = Binance.default({
  apiKey: process.env.BINANCE_TEST_API_KEY,
  apiSecret: process.env.BINANCE_TEST_API_SECRET,
  hedgeMode: true,
});

const start = async (symbol, leverage) => {
  try {
    const res = await binanceUtils.tryGetCoinInfo("EDUUSDT");
  } catch (e) {
    console.log(e);
  }
};

start("XRPUSDT", 100)
  .then((res) => console.log(res))
  .catch((e) => console.log(e));
