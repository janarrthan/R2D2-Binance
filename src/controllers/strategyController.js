import Strategy from "../models/strategy.js";
import DatabaseError from "../utils/DatabaseError.js";

const create = async (data) => {
  try {
    const strategy = new Strategy(data);
    await strategy.save();
    return strategy;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getAll = async () => {
  try {
    return await Strategy.find({}).populate({ path: "channel" }).exec();
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findManyByName = async (names) => {
  try {
    return await Strategy.find({ strategyName: { $in: names } });
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findManyByIds = async (ids) => {
  try {
    return await Strategy.find({ _id: { $in: ids } });
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    return await Strategy.findById(id);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const find = async (searchQry) => {
  try {
    return await Strategy.find(searchQry);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const updateById = async (id, updates) => {
  try {
    return await Strategy.findByIdAndUpdate(id, updates);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteMany = async (searchQry) => {
  try {
    const strategies = await Strategy.deleteMany(searchQry);
    return strategies;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteById = async (id) => {
  try {
    const strategy = await Strategy.findByIdAndDelete({ _id: id });
    return strategy;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  create,
  getAll,
  findById,
  updateById,
  find,
  deleteMany,
  deleteById,
  findManyByName,
  findManyByIds,
};
