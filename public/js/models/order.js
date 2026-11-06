var datatable;
var addForm;
var saveForm;

const entryPrice = $("#entryPrice").val();

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/orders/" + $("#signalId").val(),
      dataSrc: "data",
    },
    columns: [
      { data: "userId.userName" },
      { data: "qty" },
      {
        data: (order) => {
          return (order.qty * entryPrice).toFixed(2);
        },
      },
      {
        data: (signal) => {
          if (signal.status == "Active") {
            return `<span style="color:blue;">Active</span>`;
          } else if (signal.status == "Stop Loss") {
            return `<span style="color:red;">Stop Loss</span>`;
          } else if (signal.status == "Target Hit") {
            return `<span style="color:green;">Target Hit</span>`;
          }
        },
      },
      {
        data: function (data) {
          return `
                          <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
                      `;
        },
      },
    ],
  });
});

// Create
const create = async () => {
  const url = "/api/orders";

  const data = {
    usersEmails: $("#usersEmails").val(),
    signalId: $("#signalId").val(),
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
  const url = "/api/orders/" + id;

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

const initiateCancellAll = (id) => {
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this information!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      cancellAll(id);
    }
  });
};

const cancellAll = async (id) => {
  const url = "/api/orders/cancell/" + id;

  showLoader("#btn-delete-all", { content: generalLoader });

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
    hideLoader("#btn-delete-all", { content: `Cancell All` });
  }
};

$(document).ready(() => {
  addForm = $("#add-form");
  saveForm = $("#save-form");

  addForm.validate({
    rules: {
      usersEmails: {
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

  // saveForm.validate({
  //   rules: {
  //     email: {
  //       required: true,
  //     },
  //     bybitOrderId: {
  //       required: true,
  //     },
  //   },
  // });

  // saveForm.on("submit", function (e) {
  //   e.preventDefault();

  //   if (saveForm.valid()) {
  //     saveOrder();
  //   }
  // });
});

// const saveOrder = async () => {
//   const url = "/api/orders/save";

//   const data = {
//     email: $("#email").val(),
//     signalId: $("#signalId").val(),
//     bybitOrderId: $("#bybitOrderId").val(),
//   };

//   closeModal("save-modal");
//   showLoader("#btn-save-order", { content: addLoader });

//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });

//     const result = await response.json();

//     if (!result.success) {
//       return showError({ msg: result.message });
//     }

//     showSuccess({ msg: "Record created successfully!" });
//     addForm[0].reset();
//     datatable.ajax.reload();
//   } catch (e) {
//     showError({ msg: "Unable to add record. Please try again" });
//   } finally {
//     hideLoader("#btn-save-order", { content: "Add +" });
//   }
// };
