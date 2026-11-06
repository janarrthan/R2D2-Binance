import User from "../models/user.js";
import DatabaseError from "../utils/DatabaseError.js";

const createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const updateUser = async (id, userData) => {
  try {
    const user = await User.findOneAndUpdate({ _id: id }, userData);
    return user;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteUser = async (id) => {
  try {
    const user = await User.findByIdAndDelete({ _id: id });
    return user;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getActiveUsers = async () => {
  try {
    const users = await User.find({ status: "Active" });
    return users;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getAllUsers = async () => {
  try {
    const user = await User.find({});
    return user;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findActiveUsersByChannel = async (channelId) => {
  try {
    const users = await User.find({ tradingChannels: channelId, status: "Active" });
    return users;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findUsersByEmails = async (emails) => {
  try {
    const users = await User.find({ email: { $in: emails } });
    return users;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  createUser,
  deleteUser,
  getActiveUsers,
  getAllUsers,
  updateUser,
  findById,
  findActiveUsersByChannel,
  findUsersByEmails,
};
