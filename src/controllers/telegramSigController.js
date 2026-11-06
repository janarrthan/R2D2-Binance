import TelegramSignal from "../models/telegramSignal.js";
import DatabaseError from "../utils/DatabaseError.js";

const createSignal = async (telegramSignal) => {
  try {
    const signal = new TelegramSignal(telegramSignal);
    await signal.save();
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findMany = async (searchQry, populate) => {
  try {
    const search = searchQry || {};

    if (populate) {
      return await TelegramSignal.find(search).populate(populate).lean().exec();
    } else {
      return await TelegramSignal.find(search).lean();
    }
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    const signal = await TelegramSignal.findById(id);
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findOne = async (searchQry) => {
  try {
    const signal = await TelegramSignal.findOne(searchQry);
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findRepeatedSignals = async (telegramSignal) => {
  try {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const endDate = new Date().toISOString();

    const repeatedSignals = await TelegramSignal.find({
      coinName: telegramSignal.coinName,
      direction: telegramSignal.direction,
      status: "Active",
      channel: telegramSignal.channel,
      $and: [{ dateAdded: { $gte: startDate } }, { dateAdded: { $lte: endDate } }],
    });

    return repeatedSignals;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const isDuplicateSignal = async (telegramSignal) => {
  const duplicateSignals = await TelegramSignal.find({
    channel: telegramSignal.channel,
    coinName: telegramSignal.coinName,
    entryPrice: telegramSignal.entryPrice,
    stopLoss: telegramSignal.stopLoss,
    direction: telegramSignal.direction,
  })
    .lean()
    .exec();

  if (duplicateSignals.length > 0) {
    const curDateAdded = new Date(telegramSignal.dateAdded);
    const curSignalDate = curDateAdded.getDate();
    const curSignalMonth = curDateAdded.getMonth();
    const curSignalYear = curDateAdded.getFullYear();

    var isDuplicate = true;

    for (var i = 0; i < duplicateSignals.length; i++) {
      const dupSignal = duplicateSignals[i];
      const duplicDateAdded = new Date(dupSignal.dateAdded);
      const duplicDate = duplicDateAdded.getDate();
      const duplicMonth = duplicDateAdded.getDay();
      const duplicYear = duplicDateAdded.getFullYear();

      if (curSignalDate == duplicDate && curSignalMonth == duplicMonth && curSignalYear == duplicYear) {
        for (var k = 0; k < telegramSignal.targets.length; k++) {
          if (telegramSignal.targets[k] != dupSignal.targets[k]) {
            isDuplicate = false;
          }
        }
      }
    }

    if (isDuplicate) {
      return true;
    }
  }

  return false;
};

const updateById = async (id, updates) => {
  try {
    const signal = await TelegramSignal.findByIdAndUpdate(id, updates, { new: true });
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteSignal = async (id) => {
  try {
    const signal = await TelegramSignal.findByIdAndDelete({ _id: id });
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  createSignal,
  deleteSignal,
  updateById,
  findMany,
  findById,
  findRepeatedSignals,
  isDuplicateSignal,
  findOne,
};
