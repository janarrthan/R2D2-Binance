import BTSignal from "../models/btSignal.js";
import DatabaseError from "../utils/DatabaseError.js";

const createSignal = async (data) => {
  try {
    const signal = new BTSignal(data);
    await signal.save();
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const createMultipleSignals = async (tempSignals) => {
  try {
    return await BTSignal.insertMany(tempSignals);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    const signal = await BTSignal.findById(id);
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findMany = async (search, populate) => {
  try {
    if (populate) {
      const signals = await BTSignal.find(search).populate(populate).lean().exec();
      return signals;
    }
    const signals = await BTSignal.find(search).lean();
    return signals;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findOne = async (search) => {
  try {
    const signal = await BTSignal.findOne(search);
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const updateById = async (id, updates) => {
  try {
    const signal = await BTSignal.findByIdAndUpdate({ _id: id }, updates, { new: true });
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteById = async (id) => {
  try {
    const signal = await BTSignal.findByIdAndDelete({ _id: id });
    return signal;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  createSignal,
  deleteById,
  findById,
  findMany,
  findOne,
  createMultipleSignals,
  updateById,
};
