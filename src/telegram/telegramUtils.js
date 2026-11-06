import TelegramAccount from "../telegram/telegram.js";
import telAccountController from "../controllers/telegramAccountController.js";

const getTelegramAccount = async (id) => {
  const dbTelAccount = await telAccountController.findById(id);

  if (!dbTelAccount) {
    return undefined;
  }

  const telAccount = new TelegramAccount(
    dbTelAccount.apiId,
    dbTelAccount.apiHash,
    dbTelAccount.accountName,
    dbTelAccount._id
  );

  return telAccount;
};

export default {
  getTelegramAccount,
};
