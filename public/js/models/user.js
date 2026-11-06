var datatable;
var addForm;
var updateForm;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/users",
      dataSrc: "data",
    },
    columns: [
      { data: "userName" },
      { data: "email" },
      { data: "phoneNumber" },
      { data: "nic" },
      { data: "totalInvestment" },
      {
        data: (user) => {
          return new Date(user.apiLastUpdatedDate).toLocaleDateString();
        },
      },
      {
        data: (user) => {
          if (user.status == "Active") {
            return `<span style="color:green;">Active</span>`;
          } else if (user.status == "Blocked") {
            return `<span style="color:red;">Blocked</span>`;
          }
        },
      },
      {
        data: function (data) {
          return `
                        <button class="btn btn-secondary btn-sm" id="rec-edit-${data._id}" onclick="initiateUpdate('${data._id}')"><i class="fas fa-edit"></i></button>
                        <a class="btn btn-secondary btn-sm"  href="/user-management/${data._id}"><i class="fas fa-tasks"></i></a>
                        <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
                    `;
        },
      },
    ],
  });
});

// Create
const create = async () => {
  const url = "/api/users";

  const data = {
    userName: $("#add-form #userName").val(),
    email: $("#add-form #email").val(),
    phoneNumber: $("#add-form #phoneNumber").val(),
    status: $("#add-form #status").val(),
    tradingStrategies: formatStrategiesAndAmount($("#add-form #tradingStrategies").val()),
    joinedDate: $("#add-form #joinedDate").val(),
    apiLastUpdatedDate: $("#add-form #apiLastUpdatedDate").val(),
    apiKey: $("#add-form #apiKey").val(),
    apiSecret: $("#add-form #apiSecret").val(),
    totalInvestment: $("#add-form #totalInvestment").val(),
    nic: $("#add-form #nic").val(),
    note: $("#add-form #note").val(),
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
  const url = "/api/users/" + id;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const data = result.data.userData;
    const tradingStrateyText = result.data.tradingStrategyText;

    updateForm.find("#userId").val(data._id);
    updateForm.find("#userName").val(data.userName);
    updateForm.find("#email").val(data.email);
    updateForm.find("#phoneNumber").val(data.phoneNumber);
    updateForm.find("#status").val(data.status);
    updateForm.find("#tradingStrategies").val(tradingStrateyText);

    updateForm.find("#joinedDate").val(new Date(data.joinedDate).toISOString().slice(0, 16));
    updateForm.find("#apiLastUpdatedDate").val(new Date(data.apiLastUpdatedDate).toISOString().slice(0, 16));
    updateForm.find("#apiKey").val(data.apiKey);
    updateForm.find("#apiSecret").val(data.apiSecret);
    updateForm.find("#totalInvestment").val(data.totalInvestment);
    updateForm.find("#totalWithdrawal").val(data.totalWithdrawal);
    updateForm.find("#nic").val(data.nic);
    updateForm.find("#note").val(data.note);

    showModal("update-modal");
  } catch (e) {
    console.log(e);
    showError({ msg: "Something went wrong. Unable to update product" });
  }
};

// Update
const update = async () => {
  const id = $("#userId").val();
  const url = "/api/users/" + id;

  closeModal("update-modal");
  showLoader("#rec-edit-" + id, { content: generalLoader });

  const data = {
    userName: $("#update-form #userName").val(),
    email: $("#update-form #email").val(),
    phoneNumber: $("#update-form #phoneNumber").val(),
    status: $("#update-form #status").val(),
    tradingStrategies: formatStrategiesAndAmount($("#update-form #tradingStrategies").val()),
    joinedDate: $("#update-form #joinedDate").val(),
    apiLastUpdatedDate: $("#update-form #apiLastUpdatedDate").val(),
    apiKey: $("#update-form #apiKey").val(),
    apiSecret: $("#update-form #apiSecret").val(),
    totalInvestment: $("#update-form #totalInvestment").val(),
    totalWithdrawal: $("#update-form #totalWithdrawal").val(),
    nic: $("#update-form #nic").val(),
    note: $("#update-form #note").val(),
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
  const url = "/api/users/" + id;

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
      userName: {
        required: true,
      },
      email: {
        required: true,
      },
      phoneNumber: {
        required: true,
      },
      status: {
        required: true,
      },
      tradingStrategies: {
        required: true,
      },
      joinedDate: {
        required: true,
      },
      apiLastUpdatedDate: {
        required: true,
      },
      apiKey: {
        required: true,
      },
      apiSecret: {
        required: true,
      },
      totalInvestment: {
        required: true,
      },
      nic: {
        required: true,
      },
    },
  });

  updateForm.validate({
    rules: {
      userName: {
        required: true,
      },
      email: {
        required: true,
      },
      phoneNumber: {
        required: true,
      },
      status: {
        required: true,
      },
      tradingStrategies: {
        required: true,
      },
      joinedDate: {
        required: true,
      },
      apiLastUpdatedDate: {
        required: true,
      },
      apiKey: {
        required: true,
      },
      apiSecret: {
        required: true,
      },
      totalInvestment: {
        required: true,
      },
      nic: {
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

// ================= Helper Functions =================
const formatStrategiesAndAmount = (strategiesAndAmount) => {
  const strategies = strategiesAndAmount.split("\n");
  const finalList = [];

  for (var i = 0; i < strategies.length; i++) {
    const strategyArr = strategies[i].split("=*=");
    const strategyName = strategyArr[0].replaceAll("[", "").replaceAll("]", "");
    const strategyAmount = parseFloat(strategyArr[1].replaceAll("[", "").replaceAll("]", "").trim());

    finalList.push({
      strategyName: strategyName.trim(),
      strategyAmount: strategyAmount,
    });
  }

  return finalList;
};
