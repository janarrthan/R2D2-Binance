import TelegramAccount from "../models/telegramAccount.js";
import Channel from "../models/channel.js";
import DatabaseError from "../utils/DatabaseError.js";

const createAccount = async (accountDetails) => {
  try {
    const telegramAccount = new TelegramAccount(accountDetails);
    await telegramAccount.save();
    return telegramAccount;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getAccounts = async () => {
  try {
    return await TelegramAccount.find({});
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getAccountsWithActiveChannels = async () => {
  try {
    const accounts = await TelegramAccount.find({ status: "Active" }).lean().exec();

    for (var i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      acc.channels = await Channel.find({
        channelAccount: acc._id,
        status: "Active",
        isListenToNewMessages: true,
      });
    }

    return accounts;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    return await TelegramAccount.findById(id);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const updateById = async (id, updates) => {
  try {
    return await TelegramAccount.findByIdAndUpdate(id, updates);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteById = async (id) => {
  try {
    return await TelegramAccount.findByIdAndDelete(id);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  createAccount,
  getAccounts,
  findById,
  updateById,
  getAccountsWithActiveChannels,
  deleteById,
};
