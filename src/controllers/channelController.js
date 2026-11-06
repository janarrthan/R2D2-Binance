import Channel from "../models/channel.js";
import DatabaseError from "../utils/DatabaseError.js";

const createChannel = async (channelDetails) => {
  try {
    const channel = new Channel(channelDetails);
    await channel.save();
    return channel;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getChannels = async () => {
  try {
    return await Channel.find({})
      .populate({ path: "channelAccount" })
      .populate({ path: "replyToChannelAccount" })
      .exec();
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const getActiveChannels = async () => {
  try {
    return await Channel.find({ status: "Active" });
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findByChannelIdFromMessage = async (channelId) => {
  try {
    return await Channel.findOne({ channelIdFromMessage: channelId });
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    return await Channel.findById(id);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findByChannelId = async (channelId) => {
  try {
    return await Channel.findOne({ channelId: channelId });
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findByTelegramAccount = async (accountId) => {
  try {
    return await Channel.findOne({ channelAccount: accountId });
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const updateById = async (id, updates) => {
  try {
    return await Channel.findByIdAndUpdate(id, updates);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteById = async (id) => {
  try {
    const channel = await Channel.findByIdAndDelete({ _id: id });
    return channel;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

export default {
  createChannel,
  getChannels,
  getActiveChannels,
  findByChannelIdFromMessage,
  findById,
  updateById,
  findByChannelId,
  findByTelegramAccount,
  deleteById,
};
