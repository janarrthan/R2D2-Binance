var datatable;

// Populate the table
$(document).ready(() => {
  datatable = $(".table").DataTable({
    responsive: true,
    ajax: {
      url: "/api/signals",
      dataSrc: "data",
    },
    columns: [
      {
        data: (signal) => {
          return new Date(signal.dateAdded).toLocaleString();
        },
      },
      { data: "channel.channelName" },
      { data: "coinName" },
      { data: "direction" },
      { data: "entryPrice" },
      { data: "targetPrice" },
      { data: "stopLoss" },
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
                          <button class="btn btn-primary btn-sm" id="rec-view-${data._id}"  onclick="showDetails('${data._id}')"><i class="fas fa-eye"></i></button>
                          <a class="btn btn-primary btn-sm" href="/orders/${data._id}"><i class="fas fa-shopping-basket"></i></a>
                          <button class="btn btn-danger btn-sm" id="rec-del-${data._id}" onclick="initiateDelete('${data._id}')"><i class="fas fa-trash"></i></button>
                      `;
        },
      },
    ],
  });
});

// Show Details
const showDetails = async (id) => {
  const url = "/api/signals/" + id;

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
              <p>Status: ${data.status}</p>
              <p>Entry Price: ${data.entryPrice}</p>
              <p>Stop Loss: ${data.stopLoss}</p>
              <p>Target: ${data.targetPrice}</p>
              <p>Telegram Signal ID: ${data.telegramSignalId || "None"}</p>
              <p>Telegram Message ID: ${data.telegramOutgoingMsgId == 0 ? "None" : data.telegramOutgoingMsgId}</p>
          `;

    $("#details-modal #left-details").html(leftHtml);
    showModal("details-modal");
  } catch (e) {
    showError({ msg: e.message });
  }
};

// Alert for deleting a record
const initiateDelete = (id) => {
  console.log(id);
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
  const url = "/api/signals/" + id;

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
