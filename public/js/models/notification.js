var datatable;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/notifications/",
      dataSrc: "data",
    },
    columns: [
      {
        data: (notif) => {
          return new Date(notif.dateAdded).toLocaleDateString();
        },
      },
      { data: "type" },
      {
        data: (notif) => {
          return notif.message.slice(0, 150) + " ...";
        },
      },
      {
        data: function (data) {
          return `  <button class="btn btn-primary btn-sm" id="rec-view-${data._id}"  onclick="showDetails('${data._id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
                `;
        },
      },
    ],
  });
});

// Show Details
const showDetails = async (id) => {
  const url = "/api/notifications/" + id;
  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const data = result.data;

    dateAdded = new Date(data.dateAdded).toLocaleDateString();

    var html = `
              <p>Date: ${dateAdded}</p>
              <p>Type: ${data.type}</p>
              <p>Message: </p>
              <hr/>
              <p style="white-space: pre-line; background: lightgrey; padding: 10px;">${data.message}</p>
          `;

    $("#details-modal .modal-body").html(html);
    showModal("details-modal");
  } catch (e) {
    showError({ msg: e.message });
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
  const url = "/api/notifications/" + id;

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
