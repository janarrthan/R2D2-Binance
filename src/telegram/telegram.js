import { Api, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/StoreSession.js";
import { NewMessage } from "telegram/events/NewMessage.js";

import TelegramError from "../utils/TelegramError.js";
import input from "input";

import channelController from "../controllers/channelController.js";
import notificationController from "../controllers/notificationController.js";
import messageHandler from "./messageHandler.js";
import playAlert from "../utils/playAlert.js";

function TelegramConnection(apiId, apiHash, accountName, UUID) {
  this.storeSession = new StoreSession(UUID);

  this.client = new TelegramClient(this.storeSession, apiId, apiHash, {
    connectionRetries: 3,
  });

  this.start = async function () {
    await this.client.start({
      phoneNumber: async () => await input.text(`Please enter your number (${accountName}): `),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () => await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    this.client.session.save();

    this.client.onError = async (error) => {
      await notificationController.createAppError(error.message);

      if (process.env.ENVIRONMENT == "dev") {
        console.log(error);
        playAlert();
      }
    };
  };

  this.closeConnection = function () {
    this.client.destroy();
  };

  this.listen = async function (channelIds) {
    this.client.addEventHandler(eventHandler, new NewMessage({ chats: channelIds }));
  };

  this.sendMessage = async (channel, message) => {
    try {
      const result = await this.client.invoke(
        new Api.messages.SendMessage({
          peer: parseInt("-100" + channel.replyToChannelId),
          message: message,
          noWebpage: true,
          noforwards: true,
          sendAs: parseInt("-100" + channel.replyToChannelId),
        })
      );

      return result.updates[0].id;
    } catch (error) {
      throw new TelegramError(error.message, 3);
    }
  };

  this.sendReplyMessage = async (channelId, messageId, message) => {
    try {
      const result = await this.client.invoke(
        new Api.messages.SendMessage({
          peer: parseInt("-100" + channelId),
          message: message,
          noWebpage: true,
          noforwards: true,
          sendAs: parseInt("-100" + channelId),
          replyTo: new Api.InputReplyToMessage({
            replyToMsgId: messageId,
          }),
        })
      );

      return result;
    } catch (error) {
      throw new TelegramError(error.message, 3);
    }
  };

  this.sendStopLossReply = async (channelId, signal, loss) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    const message = `${signal.coinName} STOP LOSS HIT (${loss}%) ⛔️⛔️⛔️`;
    return await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
  };

  this.sendStopLossReplyStartAndClose = async (channelId, signal, loss) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    const message = `${signal.coinName} STOP LOSS HIT (${loss}%) ⛔️⛔️⛔️`;

    await this.start();
    const result = await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
    this.closeConnection();
    return result;
  };

  this.sendProfitHitReply = async (channelId, signal, profit) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    const message = `${signal.coinName} PROFIT TARGET HIT (${profit}%) ✅✅✅`;
    return await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
  };

  this.sendProfitHitReplyStartAndClose = async (channelId, signal, profit) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    const message = `${signal.coinName} PROFIT TARGET HIT (${profit}%) ✅✅✅`;

    await this.start();
    const result = await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
    this.closeConnection();
    return result;
  };

  this.sendTradeCancelledReply = async (channelId, signal) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    const message = `${signal.coinName} Trade Cancelled (Target hit before entry) 🟨🟨🟨`;
    return await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
  };

  this.sendTradeCancelledReplyStartAndClose = async (channelId, signal) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    const message = `${signal.coinName} Trade Cancelled (Target hit before entry) 🟨🟨🟨`;

    await this.start();
    const result = await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
    this.closeConnection();
    return result;
  };

  this.sendClosedOnEntryReply = async (channelId, signal) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    var message = `${signal.coinName} Trade Closed On Entry`;

    if (signal.strategy == "mv-sl-to-entry-take-prof-each-tp") {
      message = `${signal.coinName} Trade Closed On Entry (Profit: ${signal.cumaltivePNL}%)`;
    }

    return await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
  };

  this.sendClosedOnEntryReplyStartAndClose = async (channelId, signal) => {
    if (!signal.telegramOutgoingMsgId || signal.telegramOutgoingMsgId == 0) {
      return;
    }

    var message = `${signal.coinName} Trade Closed On Entry`;

    if (signal.strategy == "mv-sl-to-entry-take-prof-each-tp") {
      message = `${signal.coinName} Trade Closed On Entry (Profit: ${signal.cumaltivePNL}%)`;
    }

    await this.start();
    const result = await this.sendReplyMessage(channelId, signal.telegramOutgoingMsgId, message);
    this.closeConnection();
    return result;
  };

  this.findMessage = async (channel, messageId) => {
    try {
      const result = await this.client.invoke(
        new Api.channels.GetMessages({
          channel: parseInt("-100" + channel.channelId),
          id: [parseInt(messageId)],
        })
      );

      if (result.messages[0].className == "MessageEmpty") {
        return { error: "Message not found!" };
      }

      return result;
    } catch (error) {
      throw new TelegramError(error.message, 3);
    }
  };

  this.getChannelInfo = async (channelId) => {
    try {
      var id = parseInt(channelId);

      if (isNaN(id)) {
        id = channelId;
      } else {
        id = parseInt("-100" + channelId);
      }

      const result = await this.client.invoke(
        new Api.channels.GetChannels({
          id: [id],
        })
      );

      return result.chats[0];
    } catch (error) {
      throw new TelegramError(error.message, 3);
    }
  };

  this.startAndFindMessage = async (channel, messageId) => {
    await this.start();
    const message = await this.findMessage(channel, messageId);
    this.closeConnection();
    return message;
  };

  this.startAndSendMessage = async (channel, message) => {
    await this.start();
    const messageId = await this.sendMessage(channel, message);
    this.closeConnection();
    return messageId;
  };

  this.startAndGetChannelInfo = async (channelId) => {
    await this.start();
    const result = await this.getChannelInfo(channelId);
    this.closeConnection();
    return result;
  };
}

const eventHandler = async (event) => {
  const channelId = parseInt(event.message.peerId.channelId);
  const channel = await channelController.findByChannelId(channelId);

  if (channel) {
    await messageHandler.handleMessage(event.message, channel);
  }
};

export default TelegramConnection;
