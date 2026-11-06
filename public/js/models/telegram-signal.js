var datatable;
var addForm;

const messageIdFillBtn = document.querySelector("#messageIdFillBtn");
const isCreateTradeBtn = document.querySelector("#isCreateTrade");

messageIdFillBtn.addEventListener("click", async (event) => {
  const messageId = $("#messageId").val().trim();
  var channelId = $("#telegramChannel").val();

  if (!channelId || channelId == "") {
    showError({ msg: "Select a telegram channel to auto fill the form!" });
    return;
  }

  if (messageId == "") {
    return showError({ msg: "Please provide a message Id" });
  }

  channelId = channelId.trim();
  const url = "/api/telegram-signals/fill/" + channelId + "/" + messageId;

  try {
    showLoader("#messageIdFillBtn", { content: generalLoader });

    const response = await fetch(url);
    var result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    result = result.data.messages[0];

    $("#add-form #date").val(result.date);
    $("#add-form #message").val(result.message);
    $("#telegram-message-container p").html(result.message);
  } catch (e) {
    showError({ msg: e.message });
  } finally {
    hideLoader("#messageIdFillBtn", { content: "Find" });
  }
});

isCreateTradeBtn.addEventListener("click", (event) => {
  if ($("#isCreateTrade").is(":checked")) {
    document.querySelector("#isCreateBTSignal").checked = true;
  } else {
    document.querySelector("#isCreateBTSignal").checked = false;
  }
});

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/telegram-signals",
      dataSrc: "data",
    },
    columns: [
      {
        data: (signal) => {
          return new Date(signal.dateAdded).toLocaleString();
        },
      },
      { data: "coinName" },
      { data: "direction" },
      { data: "channel.channelName" },
      { data: "messageId" },
      {
        data: (signal) => {
          if (signal.status == "Active") {
            return `<span style="color:orange;">Active</span>`;
          } else if (signal.status == "Complete") {
            return `<span style="color:green;">Complete</span>`;
          }
        },
      },
      {
        data: function (data) {
          return `
                          <button class="btn btn-primary btn-sm" id="rec-view-${data._id}"  onclick="showDetails('${data._id}')"><i class="fas fa-eye"></i></button>
                          <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
                      `;
        },
      },
    ],
  });
});

// Show Details
const showDetails = async (id) => {
  const url = "/api/telegram-signals/" + id;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const data = result.data;

    var leftHtml = `
              <p>Date: ${new Date(data.dateAdded).toLocaleString()}</p>
              <p>Coin Name: ${data.coinName}</p>
              <p>Direction: ${data.direction}</p>
              <p>Message ID: ${data.messageId}</p>
              <p>Status: ${data.status}</p>
              <p>Entry Price: ${data.entryPrice}</p>
              <p>Stop Loss: ${data.stopLoss}</p>
              <p>Targets: [${data.targets.toString().replaceAll(",", ", ")}]</p>
              <p>Telegram Signal ID: ${data._id}</p>
          `;

    $("#details-modal #left-details").html(leftHtml);
    showModal("details-modal");
  } catch (e) {
    showError({ msg: e.message });
  }
};

// Create
const create = async () => {
  const url = "/api/telegram-signals";

  const data = {
    message: $("#add-form #message").val(),
    date: $("#add-form #date").val(),
    messageId: $("#messageId").val(),
    channel: $("#telegramChannel").val(),
    isCreateTrade: $("#isCreateTrade").is(":checked"),
    isSendMessage: $("#isSendMessage").is(":checked"),
    isCreateBTSignal: $("#isCreateBTSignal").is(":checked"),
  };

  closeModal("create-modal");
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
    addForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    showError({ msg: "Unable to add record. Please try again" });
  } finally {
    hideLoader("#btn-add", { content: "Add +" });
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
  const url = "/api/telegram-signals/" + id;

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
  addForm = $("#add-form");

  addForm.validate({
    rules: {
      messageId: {
        required: true,
      },
      telegramChannel: {
        required: true,
      },
      message: {
        required: true,
      },
    },
  });

  addForm.on("submit", function (e) {
    e.preventDefault();

    if (addForm.valid()) {
      create();
    }
  });
});
