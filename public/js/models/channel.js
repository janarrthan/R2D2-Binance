var datatable;
var addForm;
var updateForm;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/channels/",
      dataSrc: "data",
    },
    columns: [
      { data: "channelAccount.accountName" },
      { data: "channelName" },
      { data: "channelId" },
      { data: "replyToChannelAccount.accountName" },
      { data: "replyToChannelName" },
      { data: "replyToChannelId" },
      {
        data: (channel) => {
          if (channel.status == "Active") {
            return `<span style="color:green;">Active</span>`;
          } else if (channel.status == "Blocked") {
            return `<span style="color:red;">Blocked</span>`;
          }
        },
      },
      {
        data: function (data) {
          return `          <a class="btn btn-primary btn-sm"  href="/channels/settings/${data._id}"><i class="fas fa-wrench"></i></a>
                          <button class="btn btn-secondary btn-sm" id="rec-edit-${data._id}" onclick="initiateUpdate('${data._id}')"><i class="fas fa-edit"></i></button>
                          <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
                        `;
        },
      },
    ],
  });
});

// Create
const create = async () => {
  const url = "/api/channels";

  const data = {
    channelAccount: $("#add-form #channelAccount").val(),
    channelName: $("#add-form #channelName").val(),
    channelId: $("#add-form #channelId").val(),
    replyToChannelAccount: $("#add-form #replyToChannelAccount").val(),
    replyToChannelName: $("#add-form #replyToChannelName").val(),
    replyToChannelId: $("#add-form #replyToChannelId").val(),
    isListenToNewMessages: $("#add-form #isListenToNewMessages").is(":checked"),
    status: $("#add-form #status").val(),
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

// Initiate update modal
const initiateUpdate = async (id) => {
  const url = "/api/channels/" + id;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const data = result.data;

    updateForm.find("#_id").val(data._id);
    updateForm.find("#channelAccount").val(data.channelAccount);
    updateForm.find("#channelName").val(data.channelName);
    updateForm.find("#channelId").val(data.channelId);
    updateForm.find("#replyToChannelId").val(data.replyToChannelId);
    updateForm.find("#replyToChannelName").val(data.replyToChannelName);
    updateForm.find("#replyToChannelAccount").val(data.replyToChannelAccount);
    updateForm.find("#isListenToNewMessages").prop("checked", data.isListenToNewMessages);
    updateForm.find("#status").val(data.status);

    showModal("update-modal");
  } catch (e) {
    console.log(e);
    showError({ msg: "Something went wrong. Unable to update product" });
  }
};

// Update
const update = async () => {
  const id = $("#_id").val();
  const url = "/api/channels/" + id;

  closeModal("update-modal");
  showLoader("#rec-edit-" + id, { content: generalLoader });

  const data = {
    channelAccount: $("#update-form #channelAccount").val(),
    channelName: $("#update-form #channelName").val(),
    channelId: $("#update-form #channelId").val(),
    replyToChannelAccount: $("#update-form #replyToChannelAccount").val(),
    replyToChannelName: $("#update-form #replyToChannelName").val(),
    replyToChannelId: $("#update-form #replyToChannelId").val(),
    isListenToNewMessages: $("#update-form #isListenToNewMessages").is(":checked"),
    status: $("#update-form #status").val(),
  };

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

    updateForm[0].reset();
    datatable.ajax.reload();
  } catch (e) {
    console.log(e);
    showError({ msg: "Something went wrong! Unable to update record." });
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
  const url = "/api/channels/" + id;

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
  updateForm = $("#update-form");

  addForm.validate({
    rules: {
      channelAccount: {
        required: true,
      },
      channelName: {
        required: true,
      },
      channelId: {
        required: true,
      },
      replyToChannelId: {
        required: true,
      },
      replyToChannelName: {
        required: true,
      },
      replyToChannelAccount: {
        required: true,
      },
      status: {
        required: true,
      },
    },
  });

  updateForm.validate({
    rules: {
      channelAccount: {
        required: true,
      },
      channelName: {
        required: true,
      },
      channelId: {
        required: true,
      },
      replyToChannelId: {
        required: true,
      },
      replyToChannelName: {
        required: true,
      },
      replyToChannelAccount: {
        required: true,
      },
      status: {
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

  updateForm.on("submit", function (e) {
    e.preventDefault();

    if (updateForm.valid()) {
      update();
    }
  });
});
