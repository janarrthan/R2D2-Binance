var datatable;
var normalTradeForm;
var oppositeTradeForm;
var percEntryTradeForm;

var normalTradeUpdateForm;
var oppositeTradeUpdateForm;
var percEntryTradeUpdateForm;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/strategies/",
      dataSrc: "data",
    },
    columns: [
      { data: "strategyName" },
      { data: "channel.channelName" },
      {
        data: function (data) {
          return getStrategyMainTypeDisplayName(data.type);
        },
      },
      { data: "strategyFor" },
      {
        data: function (data) {
          return getStrategyTypeDisplayName(data.strategyType);
        },
      },
      {
        data: (data) => {
          if (data.status == "Active") {
            return `<span style="color:green;">Active</span>`;
          } else if (data.status == "Blocked") {
            return `<span style="color:red;">Blocked</span>`;
          }
        },
      },
      {
        data: function (data) {
          return `          
                    <button class="btn btn-secondary btn-sm" id="rec-edit-${data._id}" onclick="initiateUpdate('${data._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
            `;
        },
      },
    ],
  });
});

const addNormalTradeStrategy = async () => {
  const url = "/api/strategies";

  const data = {
    type: "NTS",
    strategyName: normalTradeForm.find("#strategyName").val(),
    channel: normalTradeForm.find("#channel").val(),
    strategyFor: normalTradeForm.find("#strategyFor").val(),
    strategyType: normalTradeForm.find("#strategyType").val(),
    status: normalTradeForm.find("#status").val(),
    selectedTargetNo: normalTradeForm.find("#selectedTargetNo").val(),
    isPlaceTradeIfTargetDoesntExist: normalTradeForm.find("#isPlaceTradeIfTargetDoesntExist").is(":checked"),
    tradeCancelTargetNo: normalTradeForm.find("#tradeCancelTargetNo").val(),
    isExclRepeatTrades: normalTradeForm.find("#isExclRepeatTrades").is(":checked"),
    excludedDates: getExcludedDates(normalTradeForm[0].id),
    excludedDays: getExcludedDays(normalTradeForm[0].id),
  };

  closeModal("create-normal-trade-modal");
  showLoader("#btn-add", { content: addLoader });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record created successfully!" });
    normalTradeForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to add record. Please try again" });
  } finally {
    hideLoader("#btn-add", { content: "Add +" });
  }
};

const addOppositeTradeStrategy = async () => {
  const url = "/api/strategies";

  const data = {
    type: "OTS",
    strategyName: oppositeTradeForm.find("#strategyName").val(),
    channel: oppositeTradeForm.find("#channel").val(),
    strategyFor: oppositeTradeForm.find("#strategyFor").val(),
    strategyType: oppositeTradeForm.find("#strategyType").val(),
    status: oppositeTradeForm.find("#status").val(),

    selectedEntryTargetNo: oppositeTradeForm.find("#selectedEntryTargetNo").val(),
    selectedStoplossTargetNo: oppositeTradeForm.find("#selectedStoplossTargetNo").val(),

    isExclRepeatTrades: oppositeTradeForm.find("#isExclRepeatTrades").is(":checked"),
    excludedDates: getExcludedDates(oppositeTradeForm[0].id),
    excludedDays: getExcludedDays(oppositeTradeForm[0].id),
  };

  closeModal("create-opposite-trade-modal");
  showLoader("#btn-add", { content: addLoader });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record created successfully!" });
    oppositeTradeForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to add record. Please try again" });
  } finally {
    hideLoader("#btn-add", { content: "Add +" });
  }
};

const addPercEntryTradeStrategy = async () => {
  const url = "/api/strategies";

  const data = {
    type: "PENTS",
    strategyName: percEntryTradeForm.find("#strategyName").val(),
    channel: percEntryTradeForm.find("#channel").val(),
    strategyFor: percEntryTradeForm.find("#strategyFor").val(),
    strategyType: percEntryTradeForm.find("#strategyType").val(),
    status: percEntryTradeForm.find("#status").val(),

    selectedEntryPerc: percEntryTradeForm.find("#selectedEntryPerc").val(),
    selectedTargetNo: percEntryTradeForm.find("#selectedTargetNo").val(),
    isPlaceTradeIfTargetDoesntExist: percEntryTradeForm.find("#isPlaceTradeIfTargetDoesntExist").is(":checked"),
    tradeCancelTargetNo: percEntryTradeForm.find("#tradeCancelTargetNo").val(),

    isExclRepeatTrades: percEntryTradeForm.find("#isExclRepeatTrades").is(":checked"),
    excludedDates: getExcludedDates(percEntryTradeForm[0].id),
    excludedDays: getExcludedDays(percEntryTradeForm[0].id),
  };

  closeModal("create-perc-entry-trade-modal");
  showLoader("#btn-add", { content: addLoader });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record created successfully!" });
    percEntryTradeForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to add record. Please try again" });
  } finally {
    hideLoader("#btn-add", { content: "Add +" });
  }
};

// Initiate update modal
const initiateUpdate = async (id) => {
  const url = "/api/strategies/" + id;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const data = result.data;
    var updateForm = undefined;
    var modalId = undefined;

    if (data.type == "NTS") {
      updateForm = normalTradeUpdateForm;
      modalId = "update-normal-trade-modal";
    } else if (data.type == "OTS") {
      updateForm = oppositeTradeUpdateForm;
      modalId = "update-opposite-trade-modal";
    } else if (data.type == "PENTS") {
      updateForm = percEntryTradeUpdateForm;
      modalId = "update-perc-entry-trade-modal";
    }

    updateForm.find("#_id").val(data._id);
    updateForm.find("#strategyName").val(data.strategyName);
    updateForm.find("#channel").val(data.channel);
    updateForm.find("#strategyFor").val(data.strategyFor);
    updateForm.find("#strategyType").val(data.strategyType);
    updateForm.find("#status").val(data.status);

    updateForm.find("#isExclRepeatTrades").prop("checked", data.isExclRepeatTrades);
    updateForm.find("#excludedDates").val(data.excludedDates.join(", "));
    setExcludedDays(updateForm[0].id, data.excludedDays);

    if (data.type == "NTS") {
      updateForm.find("#selectedTargetNo").val(data.selectedTargetNo);
      updateForm.find("#isPlaceTradeIfTargetDoesntExist").prop("checked", data.isPlaceTradeIfTargetDoesntExist);
      updateForm.find("#tradeCancelTargetNo").val(data.tradeCancelTargetNo);
    } else if (data.type == "OTS") {
      updateForm.find("#selectedEntryTargetNo").val(data.selectedEntryTargetNo);
      updateForm.find("#selectedStoplossTargetNo").val(data.selectedStoplossTargetNo);
    } else if (data.type == "PENTS") {
      updateForm.find("#selectedEntryPerc").val(data.selectedEntryPerc);
      updateForm.find("#selectedTargetNo").val(data.selectedTargetNo);
      updateForm.find("#isPlaceTradeIfTargetDoesntExist").prop("checked", data.isPlaceTradeIfTargetDoesntExist);
      updateForm.find("#tradeCancelTargetNo").val(data.tradeCancelTargetNo);
    }

    showModal(modalId);
  } catch (e) {
    console.log(e);
    showError({ msg: "Something went wrong. Unable to update record" });
  }
};

const updateNormalTradeStrategy = async () => {
  const id = normalTradeUpdateForm.find("#_id").val();
  const url = "/api/strategies/" + id;

  const data = {
    type: "NTS",
    strategyName: normalTradeUpdateForm.find("#strategyName").val(),
    channel: normalTradeUpdateForm.find("#channel").val(),
    strategyFor: normalTradeUpdateForm.find("#strategyFor").val(),
    strategyType: normalTradeUpdateForm.find("#strategyType").val(),
    status: normalTradeUpdateForm.find("#status").val(),

    selectedTargetNo: normalTradeUpdateForm.find("#selectedTargetNo").val(),
    isPlaceTradeIfTargetDoesntExist: normalTradeUpdateForm.find("#isPlaceTradeIfTargetDoesntExist").is(":checked"),
    tradeCancelTargetNo: normalTradeUpdateForm.find("#tradeCancelTargetNo").val(),

    isExclRepeatTrades: normalTradeUpdateForm.find("#isExclRepeatTrades").is(":checked"),
    excludedDates: getExcludedDates(normalTradeUpdateForm[0].id),
    excludedDays: getExcludedDays(normalTradeUpdateForm[0].id),
  };

  closeModal("update-normal-trade-modal");
  showLoader("#rec-edit-" + id, { content: generalLoader });

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

    showSuccess({ msg: "Record updated successfully!" });
    normalTradeUpdateForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to update record. Please try again" });
  } finally {
    hideLoader("#rec-edit-" + id, { content: `<i class="fas fa-edit"></i>` });
  }
};

const updateOppositeTradeStrategy = async () => {
  const id = oppositeTradeUpdateForm.find("#_id").val();
  const url = "/api/strategies/" + id;

  const data = {
    type: "OTS",
    strategyName: oppositeTradeUpdateForm.find("#strategyName").val(),
    channel: oppositeTradeUpdateForm.find("#channel").val(),
    strategyFor: oppositeTradeUpdateForm.find("#strategyFor").val(),
    strategyType: oppositeTradeUpdateForm.find("#strategyType").val(),
    status: oppositeTradeUpdateForm.find("#status").val(),

    selectedEntryTargetNo: oppositeTradeUpdateForm.find("#selectedEntryTargetNo").val(),
    selectedStoplossTargetNo: oppositeTradeUpdateForm.find("#selectedStoplossTargetNo").val(),

    isExclRepeatTrades: oppositeTradeUpdateForm.find("#isExclRepeatTrades").is(":checked"),
    excludedDates: getExcludedDates(oppositeTradeUpdateForm[0].id),
    excludedDays: getExcludedDays(oppositeTradeUpdateForm[0].id),
  };

  closeModal("update-opposite-trade-modal");
  showLoader("#rec-edit-" + id, { content: generalLoader });

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

    showSuccess({ msg: "Record updated successfully!" });
    oppositeTradeUpdateForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to update record. Please try again" });
  } finally {
    hideLoader("#rec-edit-" + id, { content: `<i class="fas fa-edit"></i>` });
  }
};

const updatePercEntryTradeStrategy = async () => {
  const id = percEntryTradeUpdateForm.find("#_id").val();
  const url = "/api/strategies/" + id;

  const data = {
    type: "PENTS",
    strategyName: percEntryTradeUpdateForm.find("#strategyName").val(),
    channel: percEntryTradeUpdateForm.find("#channel").val(),
    strategyFor: percEntryTradeUpdateForm.find("#strategyFor").val(),
    strategyType: percEntryTradeUpdateForm.find("#strategyType").val(),
    status: percEntryTradeUpdateForm.find("#status").val(),

    selectedEntryPerc: percEntryTradeUpdateForm.find("#selectedEntryPerc").val(),
    selectedTargetNo: percEntryTradeUpdateForm.find("#selectedTargetNo").val(),
    isPlaceTradeIfTargetDoesntExist: percEntryTradeUpdateForm.find("#isPlaceTradeIfTargetDoesntExist").is(":checked"),
    tradeCancelTargetNo: percEntryTradeUpdateForm.find("#tradeCancelTargetNo").val(),

    isExclRepeatTrades: percEntryTradeUpdateForm.find("#isExclRepeatTrades").is(":checked"),
    excludedDates: getExcludedDates(percEntryTradeUpdateForm[0].id),
    excludedDays: getExcludedDays(percEntryTradeUpdateForm[0].id),
  };

  closeModal("update-perc-entry-trade-modal");
  showLoader("#rec-edit-" + id, { content: generalLoader });

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

    showSuccess({ msg: "Record updated successfully!" });
    percEntryTradeUpdateForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to update record. Please try again" });
  } finally {
    hideLoader("#rec-edit-" + id, { content: `<i class="fas fa-edit"></i>` });
  }
};

// Alert for deleting a record
const initiateDelete = (id) => {
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this information!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      deleteRecord(id);
    }
  });
};

// Delete a record
const deleteRecord = async (id) => {
  const url = "/api/strategies/" + id;

  showLoader("#rec-del-" + id, { content: generalLoader });

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record deleted successfully!" });
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Something went wrong. Unable to delete record!" });
  } finally {
    hideLoader("#rec-del-" + id, { content: `<i class="fas fa-trash"></i>` });
  }
};

$(document).ready(() => {
  normalTradeForm = $("#normal-trade-form");
  oppositeTradeForm = $("#opposite-trade-form");
  percEntryTradeForm = $("#perc-entry-trade-form");

  normalTradeUpdateForm = $("#normal-trade-update-form");
  oppositeTradeUpdateForm = $("#opposite-trade-update-form");
  percEntryTradeUpdateForm = $("#perc-entry-trade-udate-form");

  normalTradeForm.validate({
    rules: {
      strategyName: {
        required: true,
      },
      channel: {
        required: true,
      },
      strategyFor: {
        required: true,
      },
      strategyType: {
        required: true,
      },
      status: {
        required: true,
      },
      selectedTargetNo: {
        required: true,
      },
      tradeCancelTargetNo: {
        required: true,
      },
    },
  });

  oppositeTradeForm.validate({
    rules: {
      strategyName: {
        required: true,
      },
      channel: {
        required: true,
      },
      strategyFor: {
        required: true,
      },
      strategyType: {
        required: true,
      },
      status: {
        required: true,
      },
      selectedEntryTargetNo: {
        required: true,
      },
      selectedStoplossTargetNo: {
        required: true,
      },
    },
  });

  percEntryTradeForm.validate({
    rules: {
      strategyName: {
        required: true,
      },
      channel: {
        required: true,
      },
      strategyFor: {
        required: true,
      },
      strategyType: {
        required: true,
      },
      status: {
        required: true,
      },
      selectedTargetNo: {
        required: true,
      },
      tradeCancelTargetNo: {
        required: true,
      },
      selectedEntryPerc: {
        required: true,
      },
    },
  });

  normalTradeUpdateForm.validate({
    rules: {
      strategyName: {
        required: true,
      },
      channel: {
        required: true,
      },
      strategyFor: {
        required: true,
      },
      strategyType: {
        required: true,
      },
      status: {
        required: true,
      },
      selectedTargetNo: {
        required: true,
      },
      tradeCancelTargetNo: {
        required: true,
      },
    },
  });

  oppositeTradeUpdateForm.validate({
    rules: {
      strategyName: {
        required: true,
      },
      channel: {
        required: true,
      },
      strategyFor: {
        required: true,
      },
      strategyType: {
        required: true,
      },
      status: {
        required: true,
      },
      selectedEntryTargetNo: {
        required: true,
      },
      selectedStoplossTargetNo: {
        required: true,
      },
    },
  });

  percEntryTradeUpdateForm.validate({
    rules: {
      strategyName: {
        required: true,
      },
      channel: {
        required: true,
      },
      strategyFor: {
        required: true,
      },
      strategyType: {
        required: true,
      },
      status: {
        required: true,
      },
      selectedTargetNo: {
        required: true,
      },
      tradeCancelTargetNo: {
        required: true,
      },
      selectedEntryPerc: {
        required: true,
      },
    },
  });

  normalTradeForm.on("submit", function (e) {
    e.preventDefault();

    if (normalTradeForm.valid()) {
      addNormalTradeStrategy();
    }
  });

  oppositeTradeForm.on("submit", function (e) {
    e.preventDefault();

    if (oppositeTradeForm.valid()) {
      addOppositeTradeStrategy();
    }
  });

  percEntryTradeForm.on("submit", function (e) {
    e.preventDefault();

    if (percEntryTradeForm.valid()) {
      addPercEntryTradeStrategy();
    }
  });

  normalTradeUpdateForm.on("submit", function (e) {
    e.preventDefault();

    if (normalTradeUpdateForm.valid()) {
      updateNormalTradeStrategy();
    }
  });

  oppositeTradeUpdateForm.on("submit", function (e) {
    e.preventDefault();

    if (oppositeTradeUpdateForm.valid()) {
      updateOppositeTradeStrategy();
    }
  });

  percEntryTradeUpdateForm.on("submit", function (e) {
    e.preventDefault();

    if (percEntryTradeUpdateForm.valid()) {
      updatePercEntryTradeStrategy();
    }
  });
});

// =========================== Utility Functions ======================
const getExcludedDays = (formId) => {
  var array = [];
  var checkboxes = document.querySelectorAll("#" + formId + " #excludedDays:checked");

  for (var i = 0; i < checkboxes.length; i++) {
    array.push(parseInt(checkboxes[i].value));
  }

  return array;
};

const setExcludedDays = (formId, excludedDays) => {
  var checkboxes = document.querySelectorAll("#" + formId + " #excludedDays");

  for (var i = 0; i < checkboxes.length; i++) {
    const checkbox = checkboxes[i];

    checkbox.checked = false;

    if (excludedDays.includes(parseInt(checkbox.value))) {
      checkbox.checked = true;
    }
  }
};

const getExcludedDates = (formId) => {
  var excludedDates = document.querySelector("#" + formId + " #excludedDates").value;

  if (!excludedDates || excludedDates.trim() == "") {
    return [];
  }

  return excludedDates.split(",").map((date) => parseInt(date.trim()));
};

const getStrategyMainTypeDisplayName = (type) => {
  if (type == "NTS") {
    return "Normal Trade Strategy";
  } else if (type == "OTS") {
    return "Opposite Trade Strategy";
  } else if (type == "PENTS") {
    return "Percentage Entry Normal Trade Strategy";
  }
};

const getStrategyTypeDisplayName = (type) => {
  if (type == "normal") {
    return "Normal";
  } else if (type == "stopLossMoveToEntry") {
    return "Stop Loss Move To Entry";
  } else if (type == "tpEntry") {
    return "Target Profit Entry";
  }
};
