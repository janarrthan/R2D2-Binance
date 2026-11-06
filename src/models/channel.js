import mongoose from "mongoose";

const directionSettingsScheme = {
  keywordsForLong: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsForShort: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const coinNameSettingsScheme = {
  configForCoinName: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToRemove: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToReplace: {
    type: String,
    lowercase: true,
    trim: true,
  },

  priceMultiplier: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const entryPriceSettingsScheme = {
  configForEntryPrice: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToRemove: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToReplace: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const onelineTargetsSettingsScheme = {
  configForTargets: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToRemove: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToReplace: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const nextlineTargetsSettingsScheme = {
  configForTargets: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToRemove: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToReplace: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const stopLossSettingsScheme = {
  configForStoploss: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToRemove: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsToReplace: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const includeExcludeSettingsScheme = {
  keywordsForIncluding: {
    type: String,
    lowercase: true,
    trim: true,
  },

  keywordsForExcluding: {
    type: String,
    lowercase: true,
    trim: true,
  },
};

const extractAlertsSettingsScheme = {
  noOfSuccessExtracts: {
    type: Number,
    default: 2,
  },
  maxProfitPercAlert: {
    type: Number,
    default: 50,
  },
  maxStoplossAlert: {
    type: Number,
    default: 50,
  },

  minNumOfTargetsAlert: {
    type: Number,
    default: 2,
  },
  coinNameAlert: {
    type: String,
  },
};

const channelScheme = mongoose.Schema({
  channelAccount: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "TelegramAccount",
  },
  channelName: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  replyToChannelAccount: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "TelegramAccount",
  },
  replyToChannelName: {
    type: String,
    required: true,
  },
  replyToChannelId: {
    type: String,
    required: true,
  },
  isListenToNewMessages: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "Active",
  },

  directionSettings: directionSettingsScheme,
  coinNameSettings: coinNameSettingsScheme,
  entryPriceSettings: entryPriceSettingsScheme,
  onelineTargetsSettings: onelineTargetsSettingsScheme,
  nextlineTargetsSettings: nextlineTargetsSettingsScheme,
  stopLossSettings: stopLossSettingsScheme,
  includeExcludeSettings: includeExcludeSettingsScheme,
  extractAlertsSettings: extractAlertsSettingsScheme,
});

const Channel = mongoose.model("Channel", channelScheme);

export default Channel;
