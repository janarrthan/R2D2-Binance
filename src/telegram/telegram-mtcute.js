import { TelegramClient } from "@mtcute/node";
import { Dispatcher, filters } from "@mtcute/dispatcher";

import channelController from "../controllers/channelController.js";
import messageHandler from "./messageHandler.js";

function TelegramConnection(apiId, apiHash, accountName, UUID) {
  this.client = new TelegramClient({
    apiId: apiId,
    apiHash: apiHash,
    storage: "MCute" + UUID,
  });

  this.start = async () => {
    const self = await this.client.start();
    console.log(`✨ logged in as ${self.displayName}`);
  };

  // this.client.onError(async (error) => {
  //   await notificationController.createAppError(error.message);

  //   if (process.env.ENVIRONMENT == "dev") {
  //     console.log(error);
  //     playAlert();
  //   }
  // });

  this.listen = (chatIds) => {
    const dp = Dispatcher.for(this.client);

    dp.onNewMessage(filters.chatId(chatIds), eventHandler);
  };
}

const eventHandler = async (event) => {
  const channelId = parseInt(event.sender.inputPeer.channelId);
  const channel = await channelController.findByChannelId(channelId);

  if (channel) {
    const customEvent = {
      id: event.id,
      message: event.text,
      date: Math.floor(new Date(event.date).getTime() / 1000),
    };

    await messageHandler.handleMessage(customEvent, channel);
  }
};

export default TelegramConnection;
