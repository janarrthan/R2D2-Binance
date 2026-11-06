import PriceAlert from "../models/priceAlert.js";
import notificationController from "../controllers/notificationController.js";

const checkPriceAlert = async (currentPrice, alert) => {
  currentPrice = parseFloat(currentPrice);

  if (alert === "up" && currentPrice >= alert.targetPrice) {
    const msg = alert.coinName + " has gone up to the target price of " + alert.targetPrice;
    await notificationController.createPriceAlertWarning(msg);
    await PriceAlert.findByIdAndDelete({ _id: alert._id });
  } else if (alert.direction === "down" && currentPrice <= alert.targetPrice) {
    const msg = alert.coinName + " has gone down to the target price of " + alert.targetPrice;
    await notificationController.createPriceAlertWarning(msg);
    await PriceAlert.findByIdAndDelete({ _id: alert._id });
  }
};

export default { checkPriceAlert };
