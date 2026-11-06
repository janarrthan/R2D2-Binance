var datatable;
var addForm;
var updateForm;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/price-alerts/",
      dataSrc: "data",
    },
    columns: [
      { data: "coinName" },
      { data: "targetPrice" },
      {
        data: function (data) {
          return data.direction.toUpperCase();
        },
      },
      {
        data: function (data) {
          return new Date(data.dateAdded).toLocaleDateString();
        },
      },
      { data: "note" },
      {
        data: function (data) {
          return `<button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>`;
        },
      },
    ],
  });
});

// Create
const create = async () => {
  const url = "/api/price-alerts";

  const data = {
    coinName: $("#add-form #coinName").val(),
    targetPrice: $("#add-form #targetPrice").val(),
    direction: $("#add-form #direction").val(),
    dateAdded: $("#add-form #dateAdded").val(),
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
  const url = "/api/price-alerts/" + id;

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
      coinName: {
        required: true,
      },
      targetPrice: {
        required: true,
      },
      direction: {
        required: true,
      },
      dateAdded: {
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
