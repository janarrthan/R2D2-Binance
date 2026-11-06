var datatable;
var addForm;
var updateForm;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/telegram-accounts/",
      dataSrc: "data",
    },
    columns: [
      { data: "accountName" },
      { data: "apiId" },
      { data: "apiHash" },
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
          return `
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
  const url = "/api/telegram-accounts";

  closeModal("create-modal");
  showLoader("#btn-add", { content: addLoader });

  const data = {
    accountName: $("#add-form #accountName").val(),
    apiId: $("#add-form #apiId").val(),
    apiHash: $("#add-form #apiHash").val(),
    status: $("#status").val(),
  };

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
  const url = "/api/telegram-accounts/" + id;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const data = result.data;

    updateForm.find("#_id").val(data._id);
    updateForm.find("#accountName").val(data.accountName);
    updateForm.find("#apiId").val(data.apiId);
    updateForm.find("#apiHash").val(data.apiHash);
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
  const url = "/api/telegram-accounts/" + id;

  closeModal("update-modal");
  showLoader("#rec-edit-" + id, { content: generalLoader });

  const formData = new FormData();
  formData.append("accountName", updateForm.find("#accountName").val());
  formData.append("apiId", updateForm.find("#apiId").val());
  formData.append("apiHash", updateForm.find("#apiHash").val());
  formData.append("status", updateForm.find("#status").val());

  try {
    const response = await fetch(url, {
      method: "PATCH",
      body: formData,
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
  const url = "/api/telegram-accounts/" + id;

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
      accountName: {
        required: true,
      },
      apiId: {
        required: true,
      },
      apiHash: {
        required: true,
      },
      status: {
        required: true,
      },
    },
  });

  updateForm.validate({
    rules: {
      accountName: {
        required: true,
      },
      apiId: {
        required: true,
      },
      apiHash: {
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
