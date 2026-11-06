const extractSignal = (event, channel) => {
  if (!event.message) {
    return undefined;
  }

  const messageId = event.id;
  const msg = event.message.toLowerCase();
  const msgArr = msg.split("\n");
  const dateAdded = event.date * 1000;

  try {
    var result = {
      originalSignal: {
        message: msg,
        channelId: channel._id,
        messageId: messageId,
        dateAdded: new Date(dateAdded),
      },
      modifiedSignal: undefined,
    };

    const direction = extractDirection(channel.directionSettings, msg);
    const coinName = extractCoinName(channel.coinNameSettings, msg, msgArr);
    const entryPrice = extractEntryPrice(channel.entryPriceSettings, msg, msgArr);
    var targets = extractTargets(channel.onelineTargetsSettings, channel.nextlineTargetsSettings, msg, msgArr);
    const stoploss = extractStoploss(channel.stopLossSettings, msg, msgArr);
    const isIncludeSignal = extractIsIncludeSignal(channel.includeExcludeSettings, msg, msgArr);

    if (targets.length == 0) {
      targets = undefined;
    }

    const extractsResults = [direction, coinName, entryPrice, targets, stoploss];
    var noOfSuccessfullExtracts = 0;

    extractsResults.forEach((exResult) => {
      if (exResult) {
        noOfSuccessfullExtracts += 1;
      }
    });

    if (isIncludeSignal && noOfSuccessfullExtracts == 5) {
      result.modifiedSignal = {
        dateAdded: dateAdded,
        direction: direction,
        coinName: coinName,
        entryPrice: entryPrice,
        targets: targets,
        stopLoss: stoploss,
        channel: channel._id,
        messageId: messageId,
      };

      result = replacePrices(result, channel.coinNameSettings);
      result.modifiedSignal.coinName = replaceSymbols(
        result.modifiedSignal.coinName.toLowerCase(),
        channel.coinNameSettings.keywordsToReplace,
      ).toUpperCase();
      return result.modifiedSignal;
    } else if (isIncludeSignal && noOfSuccessfullExtracts >= channel.extractAlertsSettings.noOfSuccessExtracts) {
      return {
        error: `Unable to extract signal.\n Message Id: ${messageId}. Channel: ${channel.channelName} `,
        channelId: channel._id,
        messageId: messageId,
        channelName: channel.channelName,
        code: 400,
      };
    }

    return undefined;
  } catch (error) {
    console.log(error);
    return {
      error: error.message,
      channelId: channel._id,
      channelName: channel.channelName,
      messageId: messageId,
      code: 400,
    };
  }
};

const extractDirection = (directionSettings, msg) => {
  if (!directionSettings) {
    return undefined;
  }

  const keywordsForLong = directionSettings.keywordsForLong.split(",").map((word) => word.trim());
  const keywordsForShort = directionSettings.keywordsForShort.split(",").map((word) => word.trim());

  for (var i = 0; i < keywordsForLong.length; i++) {
    if (msg.includes(keywordsForLong[i])) {
      return "Long";
    }
  }

  for (var i = 0; i < keywordsForShort.length; i++) {
    if (msg.includes(keywordsForShort[i])) {
      return "Short";
    }
  }

  return undefined;
};

const extractCoinName = (coinNameSettings, msg, msgArr) => {
  if (!coinNameSettings) {
    return undefined;
  }

  const configs = extractConfigs(coinNameSettings.configForCoinName);
  var finalCoinName = undefined;

  for (var i = 0; i < configs.length; i++) {
    const config = configs[i];

    for (var k = 0; k < msgArr.length; k++) {
      const msgLine = msgArr[k];

      if (checkIfAllWordsExisit(config.condition, msgLine)) {
        var coinName = msgLine;

        for (var j = 0; j < config.filters.length; j++) {
          const filter = config.filters[j];
          if (coinName) {
            coinName = coinName.split(filter.seperator)[filter.index];
          }
        }

        if (coinName) {
          finalCoinName = coinName.trim();
        }
      }
    }

    if (finalCoinName) {
      break;
    }
  }

  if (finalCoinName) {
    finalCoinName = removeSymbols(finalCoinName, coinNameSettings.keywordsToRemove);

    if (!finalCoinName.includes("usdt")) {
      finalCoinName = finalCoinName.trim() + "usdt";
    }

    finalCoinName = finalCoinName.replaceAll(" ", "");

    finalCoinName = finalCoinName.toUpperCase();
  }

  return finalCoinName;
};

const extractEntryPrice = (entryPriceSettings, msg, msgArr) => {
  if (!entryPriceSettings) {
    return undefined;
  }

  const configs = extractConfigs(entryPriceSettings.configForEntryPrice);
  var finalEntryPrice = undefined;

  for (var i = 0; i < configs.length; i++) {
    const config = configs[i];

    for (var k = 0; k < msgArr.length; k++) {
      const msgLine = msgArr[k];

      if (checkIfAllWordsExisit(config.condition, msgLine)) {
        var entryPrice = msgLine;

        for (var j = 0; j < config.filters.length; j++) {
          const filter = config.filters[j];
          if (entryPrice) {
            entryPrice = entryPrice.split(filter.seperator)[filter.index];
          }
        }

        entryPrice = removeSymbols(entryPrice, entryPriceSettings.keywordsToRemove);
        entryPrice = replaceSymbols(entryPrice, entryPriceSettings.keywordsToReplace);

        if (entryPrice) {
          entryPrice = entryPrice.trim();
          entryPrice = parseFloat(entryPrice);
        }

        if (!isNaN(entryPrice)) {
          finalEntryPrice = entryPrice;
        }
      }
    }

    if (finalEntryPrice) {
      break;
    }
  }

  return finalEntryPrice;
};

const extractTargets = (onelineTargetsSettings, nextlineTargetsSettings, msg, msgArr) => {
  var onelineTargets = [];
  var nextLineTargets = [];

  if (onelineTargetsSettings.configForTargets) {
    onelineTargets = extractOnelineTargets(onelineTargetsSettings, msg, msgArr);
  }

  if (nextlineTargetsSettings.configForTargets) {
    nextLineTargets = extractNextlineTargets(nextlineTargetsSettings, msg, msgArr);
  }

  if (onelineTargets.length > nextLineTargets.length) {
    return onelineTargets;
  } else {
    return nextLineTargets;
  }
};

const extractOnelineTargets = (onelineTargetsSettings, msg, msgArr) => {
  if (!onelineTargetsSettings) {
    return undefined;
  }

  const configs = extractConfigsForOnelineTargets(onelineTargetsSettings.configForTargets);
  var finalTargets = [];

  for (var i = 0; i < configs.length; i++) {
    const config = configs[i];

    for (var k = 0; k < msgArr.length; k++) {
      const msgLine = msgArr[k];

      if (checkIfAllWordsExisit(config.condition, msgLine)) {
        var targets = msgLine;

        for (var j = 0; j < config.filters.length; j++) {
          const filter = config.filters[j];
          targets = targets.split(filter.seperator)[filter.index];
        }

        if (!targets) {
          continue;
        }

        targets = targets.split(config.finalFilter);
        const tempTargets = [];

        // Fix for the peoeye swing trade 244
        if (targets.length <= 2) {
          const checkTargets = targets[0].trim().split(" ");
          if (targets.length < checkTargets.length) {
            break;
          }
        }

        targets.forEach((target) => {
          target = removeSymbols(target, onelineTargetsSettings.keywordsToRemove); //6.750, 6.600, 6.450, 6.300, 6.000, , 5.700, 5.400, 5.100, 4.600, 4.000
          target = replaceSymbols(target, onelineTargetsSettings.keywordsToReplace); //6.750. 6.600. 6.450. 6.300. 6.000. . 5.700. 5.400. 5.100. 4.600. 4.000

          if (target.trim() != "") {
            target = target.trim();
            tempTargets.push(parseFloat(target));
          }
        });

        targets = tempTargets;
        var isNotANum = false;

        targets.forEach((target) => {
          if (isNaN(target)) {
            isNotANum = true;
          }
        });

        if (!isNotANum) {
          finalTargets = targets;
        }
      }
    }

    if (finalTargets.length > 0) {
      break;
    }
  }

  return finalTargets;
};

const extractNextlineTargets = (nextlineTargetsSettings, msg, msgArr) => {
  if (!nextlineTargetsSettings) {
    return undefined;
  }

  const configs = extractConfigs(nextlineTargetsSettings.configForTargets);
  var finalTargets = [];

  for (var i = 0; i < configs.length; i++) {
    const config = configs[i];

    const tempTargets = [];

    for (var k = 0; k < msgArr.length; k++) {
      const msgLine = msgArr[k];

      if (checkIfAllWordsExisit(config.condition, msgLine)) {
        var target = msgLine;

        for (var j = 0; j < config.filters.length; j++) {
          const filter = config.filters[j];
          target = target.split(filter.seperator)[filter.index];
        }

        target = removeSymbols(target, nextlineTargetsSettings.keywordsToRemove);
        target = replaceSymbols(target, nextlineTargetsSettings.keywordsToReplace);

        if (target && target != "") {
          target = target.trim();
          tempTargets.push(parseFloat(target));
        } else {
          tempTargets.push(undefined);
        }
      }
    }

    var isNotANum = false;

    tempTargets.forEach((target) => {
      if (isNaN(target)) {
        isNotANum = true;
      }
    });

    if (!isNotANum) {
      finalTargets = tempTargets;
    }

    if (finalTargets) {
      break;
    }
  }

  return finalTargets;
};

const extractStoploss = (stoplossSettings, msg, msgArr) => {
  if (!stoplossSettings) {
    return undefined;
  }

  const configs = extractConfigs(stoplossSettings.configForStoploss);
  var finalStoploss = undefined;

  for (var i = 0; i < configs.length; i++) {
    const config = configs[i];

    for (var k = 0; k < msgArr.length; k++) {
      const msgLine = msgArr[k];

      if (checkIfAllWordsExisit(config.condition, msgLine)) {
        var stoploss = msgLine;

        for (var j = 0; j < config.filters.length; j++) {
          const filter = config.filters[j];
          stoploss = stoploss.split(filter.seperator)[filter.index];
        }

        stoploss = removeSymbols(stoploss, stoplossSettings.keywordsToRemove);
        stoploss = replaceSymbols(stoploss, stoplossSettings.keywordsToReplace);

        if (!stoploss) {
          continue;
        }

        stoploss = stoploss.trim();
        stoploss = parseFloat(stoploss);

        if (!isNaN(stoploss)) {
          finalStoploss = stoploss;
        }
      }
    }

    if (finalStoploss) {
      break;
    }
  }

  return finalStoploss;
};

const extractIsIncludeSignal = (includeExcludeSettings, msg, msgArr) => {
  if (!includeExcludeSettings.keywordsForIncluding && !includeExcludeSettings.keywordsForExcluding) {
    return true;
  }

  var isInclude = true;

  if (includeExcludeSettings.keywordsForIncluding) {
    const configs = extractConfigs(includeExcludeSettings.keywordsForIncluding);
    var tempIsInclude = false;

    for (var i = 0; i < configs.length; i++) {
      const config = configs[i];

      for (var k = 0; k < msgArr.length; k++) {
        const msgLine = msgArr[k];

        if (checkIfAllWordsExisit(config.condition, msgLine)) {
          tempIsInclude = true;
        }
      }
    }

    isInclude = tempIsInclude;
  }

  if (includeExcludeSettings.keywordsForExcluding) {
    const configs = extractConfigs(includeExcludeSettings.keywordsForExcluding);

    for (var i = 0; i < configs.length; i++) {
      const config = configs[i];

      for (var k = 0; k < msgArr.length; k++) {
        const msgLine = msgArr[k];

        if (checkIfAllWordsExisit(config.condition, msgLine)) {
          isInclude = false;
        }
      }
    }
  }

  return isInclude;
};

// =================== Helper Functions ========================

const extractConfigs = (text) => {
  const config = text.split("\n");

  var filteredConfig = [];

  for (var i = 0; i < config.length; i++) {
    const modifiedConfig = {
      condition: [],
      filters: [],
    };

    const curConfig = config[i].split("=*=");

    modifiedConfig.condition = removeSquareBrackets(curConfig[0])
      .split("&&")
      .map((word) => word.trim());

    for (var k = 1; k < curConfig.length; k++) {
      var filter = { seperator: "", index: -1 };
      const filters = removeSquareBrackets(curConfig[k]).split("===");

      filter.seperator = filters[0].trim();
      filter.index = parseInt(filters[1]);

      if (filter.seperator == "space") {
        filter.seperator = " ";
      }

      modifiedConfig.filters.push(filter);
    }

    filteredConfig.push(modifiedConfig);
  }

  return filteredConfig;
};

const extractConfigsForOnelineTargets = (text) => {
  const config = text.split("\n");

  var filteredConfig = [];

  for (var i = 0; i < config.length; i++) {
    const modifiedConfig = {
      condition: [],
      filters: [],
      finalFilter: undefined,
    };

    const curConfig = config[i].split("=*=");

    modifiedConfig.condition = removeSquareBrackets(curConfig[0])
      .split("&&")
      .map((word) => word.trim());

    for (var k = 1; k < curConfig.length - 1; k++) {
      var filter = { seperator: "", index: -1 };
      const filters = removeSquareBrackets(curConfig[k]).split("===");

      filter.seperator = filters[0].trim();
      filter.index = parseInt(filters[1]);

      if (filter.seperator == "space") {
        filter.seperator = " ";
      }

      modifiedConfig.filters.push(filter);
    }

    modifiedConfig.finalFilter = removeSquareBrackets(curConfig[curConfig.length - 1]).trim();

    filteredConfig.push(modifiedConfig);
  }

  return filteredConfig;
};

const extractReplaceConfig = (text) => {
  var replacersTextArr = text.split("\n");
  var replacers = [];

  for (var i = 0; i < replacersTextArr.length; i++) {
    const curReplacerArr = replacersTextArr[i].split("=*=");
    const replacerArr = removeSquareBrackets(curReplacerArr[0]).split("===");

    var replacer = {
      replacingIdentifier: replacerArr[0].trim(),
      replaceWord: replacerArr[1].trim(),
      exclude: [],
    };

    if (curReplacerArr.length > 1) {
      const excludedWords = removeSquareBrackets(curReplacerArr[1])
        .split(",")
        .map((word) => word.trim());

      replacer.exclude = excludedWords;
    }

    replacers.push(replacer);
  }

  return replacers;
};

const removeSquareBrackets = (text) => {
  return text.replaceAll("[", "").replaceAll("]", "");
};

const checkIfAllWordsExisit = (wordsArr, msgLine) => {
  var isExist = true;

  const excludedWords = [];

  wordsArr.forEach((word) => {
    if (word.includes("!")) {
      excludedWords.push(word.replaceAll("!", ""));
    }
  });

  const includedWords = wordsArr.filter((word) => !word.includes("!"));

  includedWords.forEach((word) => {
    if (!msgLine.includes(word)) {
      isExist = false;
    }
  });

  excludedWords.forEach((word) => {
    if (msgLine.includes(word)) {
      isExist = false;
    }
  });

  return isExist;
};

const removeSymbols = (text, words) => {
  if (!words || !text) {
    return text;
  }

  words = words.split(",").map((word) => word.trim());

  for (var i = 0; i < words.length; i++) {
    text = text.replaceAll(words[i], "");
  }

  return text;
};

const replaceSymbols = (text, replaceConfig) => {
  if (!replaceConfig || !text) {
    return text;
  }
  const replacers = extractReplaceConfig(replaceConfig);

  for (var i = 0; i < replacers.length; i++) {
    const replacer = replacers[i];

    if (!replacer.exclude.includes(text)) {
      if (text != replacer.replaceWord) {
        text = text.replaceAll(replacer.replacingIdentifier, replacer.replaceWord);
      }
    }
  }

  return text;
};

const replacePrices = (signal, coinNameSettings) => {
  if (!coinNameSettings.priceMultiplier) {
    return signal;
  }

  const priceMultiplierConfigArr = coinNameSettings.priceMultiplier.split("\n");

  for (var i = 0; i < priceMultiplierConfigArr.length; i++) {
    const config = removeSquareBrackets(priceMultiplierConfigArr[i]);
    const configArr = config.split("===");

    const coinName = configArr[0].trim().toLowerCase();
    const multiplier = parseFloat(configArr[1].trim());

    if (coinName == signal.modifiedSignal.coinName.toLowerCase()) {
      signal.modifiedSignal.entryPrice = signal.modifiedSignal.entryPrice * multiplier;
      signal.modifiedSignal.stopLoss = signal.modifiedSignal.stopLoss * multiplier;
      signal.modifiedSignal.targets = signal.modifiedSignal.targets.map((target) => target * multiplier);
    }
  }

  return signal;
};

export default {
  extractSignal,
};
