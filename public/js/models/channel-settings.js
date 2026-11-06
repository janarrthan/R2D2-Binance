var signalDirectionForm;
var signalCoinNameForm;
var signalEntryPriceForm;
var signalTargetsOnelineForm;
var signalTargetsNextlineForm;
var signalStoplossForm;
var signalIncludeExcludeForm;
var extractAlertsForm;

const channelId = $("#channelId").val();
const url = "/api/channels/settings/" + channelId;

const saveDirection = async () => {
  const data = {
    dateType: "signalDirectionSettings",
    keywordsForLong: signalDirectionForm.find("#keywordsForLong").val(),
    keywordsForShort: signalDirectionForm.find("#keywordsForShort").val(),
  };

  const buttonSelector = "#" + signalDirectionForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveCoinName = async () => {
  const data = {
    dateType: "signalCoinNameSettings",
    configForCoinName: signalCoinNameForm.find("#configForCoinName").val(),
    keywordsToRemove: signalCoinNameForm.find("#keywordsToRemove").val(),
    keywordsToReplace: signalCoinNameForm.find("#keywordsToReplace").val(),
    priceMultiplier: signalCoinNameForm.find("#priceMultiplier").val(),
  };

  const buttonSelector = "#" + signalCoinNameForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveEntryPrice = async () => {
  const data = {
    dateType: "signalEntryPriceSettings",
    configForEntryPrice: signalEntryPriceForm.find("#configForEntryPrice").val(),
    keywordsToRemove: signalEntryPriceForm.find("#keywordsToRemove").val(),
    keywordsToReplace: signalEntryPriceForm.find("#keywordsToReplace").val(),
  };

  const buttonSelector = "#" + signalEntryPriceForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveOnelineTargets = async () => {
  const data = {
    dateType: "signalOnelineTargetsSettings",
    configForTargets: signalTargetsOnelineForm.find("#configForTargets").val(),
    keywordsToRemove: signalTargetsOnelineForm.find("#keywordsToRemove").val(),
    keywordsToReplace: signalTargetsOnelineForm.find("#keywordsToReplace").val(),
  };

  const buttonSelector = "#" + signalTargetsOnelineForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveNextlineTargets = async () => {
  const data = {
    dateType: "signalNextlineTargetsSettings",
    configForTargets: signalTargetsNextlineForm.find("#configForTargets").val(),
    keywordsToRemove: signalTargetsNextlineForm.find("#keywordsToRemove").val(),
    keywordsToReplace: signalTargetsNextlineForm.find("#keywordsToReplace").val(),
  };

  const buttonSelector = "#" + signalTargetsNextlineForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveStoploss = async () => {
  const data = {
    dateType: "signalStoplossSettings",
    configForStoploss: signalStoplossForm.find("#configForStoploss").val(),
    keywordsToRemove: signalStoplossForm.find("#keywordsToRemove").val(),
    keywordsToReplace: signalStoplossForm.find("#keywordsToReplace").val(),
  };

  const buttonSelector = "#" + signalStoplossForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveIncludeExclude = async () => {
  const data = {
    dateType: "signalIncludeExcludeSettings",
    keywordsForIncluding: signalIncludeExcludeForm.find("#keywordsForIncluding").val(),
    keywordsForExcluding: signalIncludeExcludeForm.find("#keywordsForExcluding").val(),
  };

  const buttonSelector = "#" + signalIncludeExcludeForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

const saveExtractAlerts = async () => {
  const data = {
    dateType: "extractAlertsSettings",
    noOfSuccessExtracts: extractAlertsForm.find("#noOfSuccessExtracts").val(),
    maxProfitPercAlert: extractAlertsForm.find("#maxProfitPercAlert").val(),
    maxStoplossAlert: extractAlertsForm.find("#maxStoplossAlert").val(),
    minNumOfTargetsAlert: extractAlertsForm.find("#minNumOfTargetsAlert").val(),
    coinNameAlert: extractAlertsForm.find("#coinNameAlert").val(),
  };

  const buttonSelector = "#" + extractAlertsForm[0].id + " #btn-submit";
  showLoader(buttonSelector, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Settings updated successfully!" });
  } catch (e) {
    showError({ msg: "Something went wrong! Unable to update settings." });
    console.log(e);
  } finally {
    hideLoader(buttonSelector, { content: `Save Settings` });
  }
};

$(document).ready(() => {
  signalDirectionForm = $("#channel-setting-direction");
  signalCoinNameForm = $("#channel-setting-coinname");
  signalEntryPriceForm = $("#channel-setting-entry");
  signalTargetsOnelineForm = $("#channel-setting-targets-oneline");
  signalTargetsNextlineForm = $("#channel-setting-targets-nextline");
  signalStoplossForm = $("#channel-setting-stoploss");
  signalIncludeExcludeForm = $("#channel-setting-include_exclude");
  extractAlertsForm = $("#channel-setting-extract-alerts");

  signalDirectionForm.validate({
    rules: {
      keywordsForLong: {
        required: true,
      },
      keywordsForShort: {
        required: true,
      },
    },
  });

  signalCoinNameForm.validate({
    rules: {
      configForCoinName: {
        required: true,
      },
    },
  });

  signalEntryPriceForm.validate({
    rules: {
      configForEntryPrice: {
        required: true,
      },
    },
  });

  signalTargetsOnelineForm.validate({
    rules: {
      configForTargets: {
        required: true,
      },
    },
  });

  signalTargetsNextlineForm.validate({
    rules: {
      configForTargets: {
        required: true,
      },
    },
  });

  signalStoplossForm.validate({
    rules: {
      configForStoploss: {
        required: true,
      },
    },
  });

  extractAlertsForm.validate({
    rules: {
      noOfSuccessExtracts: {
        required: true,
      },
    },
  });

  signalDirectionForm.on("submit", function (e) {
    e.preventDefault();

    if (signalDirectionForm.valid()) {
      saveDirection();
    }
  });

  signalCoinNameForm.on("submit", function (e) {
    e.preventDefault();

    if (signalCoinNameForm.valid()) {
      saveCoinName();
    }
  });

  signalEntryPriceForm.on("submit", function (e) {
    e.preventDefault();

    if (signalEntryPriceForm.valid()) {
      saveEntryPrice();
    }
  });

  signalTargetsOnelineForm.on("submit", function (e) {
    e.preventDefault();

    if (signalTargetsOnelineForm.valid()) {
      saveOnelineTargets();
    }
  });

  signalTargetsNextlineForm.on("submit", function (e) {
    e.preventDefault();

    if (signalTargetsNextlineForm.valid()) {
      saveNextlineTargets();
    }
  });

  signalStoplossForm.on("submit", function (e) {
    e.preventDefault();

    if (signalStoplossForm.valid()) {
      saveStoploss();
    }
  });

  signalStoplossForm.on("submit", function (e) {
    e.preventDefault();

    if (signalStoplossForm.valid()) {
      saveStoploss();
    }
  });

  signalIncludeExcludeForm.on("submit", function (e) {
    e.preventDefault();

    if (signalIncludeExcludeForm.valid()) {
      saveIncludeExclude();
    }
  });

  extractAlertsForm.on("submit", function (e) {
    e.preventDefault();

    if (extractAlertsForm.valid()) {
      saveExtractAlerts();
    }
  });
});
