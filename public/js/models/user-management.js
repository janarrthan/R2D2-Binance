const positionTap = document.querySelector("#nav-positions-tab");
const openOrdersTap = document.querySelector("#nav-open_orders-tab");
const openAlgoOrdersTap = document.querySelector("#nav-open_algo_orders-tab");

const userId = $("#userId").val();

positionTap.addEventListener("click", async () => {
  fetchPostions();
});

openOrdersTap.addEventListener("click", async () => {
  fetchOpenOrders();
});

openAlgoOrdersTap.addEventListener("click", async () => {
  fetchOpenAlgoOrders();
});

const fetchPostions = async () => {
  const url = "/api/user-management/get_positions/" + userId;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const trades = result.data;
    var tableBody = ``;

    trades.forEach((trade) => {
      const coinName = trade.coinName;
      const createdTime = trade.createdTime;
      const direction = trade.direction;

      const side = trade.side;
      const qty = trade.qty;
      const positionIdx = trade.side;

      tableBody += `
            <tr>
                <td>${coinName}</td>
                <td>${direction}</td>
                <td>${Math.round(trade.positionAmt)}</td>
                <td>${qty}</td>
                <td>${trade.unrealisedPnl}</td>
                <td>${parseFloat(trade.entryPrice).toFixed(8)}</td>
                <td>${trade.takeProfit}</td>
                <td>${trade.stopLoss}</td>
                <td><button class="btn btn-danger btn-sm" id="pos-del-${trade.createdTime}" onclick="initiatePosDelete('${createdTime}', '${coinName}', '${side}', '${qty}', '${positionIdx}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });

    $("#positions-table").DataTable().destroy();
    $("#positions-table tbody").html(tableBody);
    $("#position-qty").html(trades.length);
    const postionsTable = $("#positions-table").DataTable({ responsive: true });
  } catch (e) {
    showError({ msg: e.message });
  }
};

const fetchOpenOrders = async () => {
  const url = "/api/user-management/get_open_orders/" + userId;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const trades = result.data;
    var tableBody = ``;

    trades.forEach((trade) => {
      const orderId = trade.orderId;
      const coinName = trade.coinName;
      const direction = trade.direction;
      const side = trade.side;
      const createdTime = trade.createdTime;
      const amount = trade.amount;
      const type = trade.type;
      const stopPrice = trade.stopPrice;

      const entryPrice = trade.entryPrice;
      const takeProfit = trade.takeProfit;
      const stopLoss = trade.stopLoss;

      tableBody += `
              <tr>
                  <td>${coinName}</td>
                  <td>${direction}</td>
                  <td>${side}</td>
                  <td>${type}</td>
                  <td>${amount}</td>
                  <td>${stopPrice}</td>
                  <td><button class="btn btn-danger btn-sm" id="open-del-${createdTime}" onclick="initiateOpenOrderDelete('${createdTime}', '${coinName}', '${orderId}')"><i class="fas fa-trash"></i></button></td>
              </tr>
          `;
    });

    $("#open-orders-table").DataTable().destroy();
    $("#open-orders-table tbody").html(tableBody);
    $("#open-orders-qty").html(trades.length);
    const openOrderTable = $("#open-orders-table").DataTable({ responsive: true });
  } catch (e) {
    console.log(e);
    showError({ msg: e.message });
  }
};

const fetchOpenAlgoOrders = async () => {
  const url = "/api/user-management/get_algo_open_orders/" + userId;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    const trades = result.data;
    var tableBody = ``;

    trades.forEach((trade) => {
      const orderId = trade.orderId;
      const coinName = trade.coinName;
      const direction = trade.direction;
      const side = trade.side;
      const createdTime = trade.createdTime;
      const amount = trade.amount;
      const type = trade.type;
      const stopPrice = trade.stopPrice;

      tableBody += `
              <tr>
                  <td>${coinName}</td>
                  <td>${direction}</td>
                  <td>${side}</td>
                  <td>${type}</td>
                  <td>${amount}</td>
                  <td>${stopPrice}</td>
                  <td><button class="btn btn-danger btn-sm" id="open-del-${createdTime}" onclick="initiateOpenAlgoOrderDelete('${createdTime}', '${coinName}', '${orderId}')"><i class="fas fa-trash"></i></button></td>
              </tr>
          `;
    });

    $("#open-algo-orders-table").DataTable().destroy();
    $("#open-algo-orders-table tbody").html(tableBody);
    $("#open-algo-orders-qty").html(trades.length);
    const openOrderTable = $("#open-algo-orders-table").DataTable({ responsive: true });
  } catch (e) {
    console.log(e);
    showError({ msg: e.message });
  }
};

const initiatePosDelete = (btnId, coinName, side, qty, positionIdx) => {
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this information!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      deletePos(btnId, coinName, side, qty, positionIdx);
    }
  });
};

const deletePos = async (btnId, coinName, side, qty, positionIdx) => {
  const url = "/api/user-management/close_position/" + userId;

  showLoader("#pos-del-" + btnId, { content: generalLoader });

  const data = {
    coinName: coinName,
    side: side,
    qty: qty,
    positionIdx: positionIdx,
  };

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record deleted successfully!" });
    fetchPostions();
  } catch (e) {
    showError({ msg: "Something went wrong. Unable to delete record!" });
  } finally {
    hideLoader("#pos-del-" + btnId, { content: `<i class="fas fa-trash"></i>` });
  }
};

const initiateOpenOrderDelete = (btnId, coinName, orderId) => {
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this information!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      deleteOpenOrder(btnId, coinName, orderId);
    }
  });
};

const deleteOpenOrder = async (btnId, coinName, orderId) => {
  const url = "/api/user-management/close_open_order/" + userId;

  showLoader("#open-del-" + btnId, { content: generalLoader });

  const data = {
    coinName: coinName,
    orderId: orderId,
  };

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record deleted successfully!" });
    fetchOpenOrders();
  } catch (e) {
    showError({ msg: "Something went wrong. Unable to delete record!" });
  } finally {
    hideLoader("#open-del-" + btnId, { content: `<i class="fas fa-trash"></i>` });
  }
};

const initiateOpenAlgoOrderDelete = (btnId, coinName, orderId) => {
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this information!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      deleteOpenAlgoOrder(btnId, coinName, orderId);
    }
  });
};

const deleteOpenAlgoOrder = async (btnId, coinName, orderId) => {
  const url = "/api/user-management/close_open_algo_order/" + userId;

  showLoader("#open-del-" + btnId, { content: generalLoader });

  const data = {
    coinName: coinName,
    orderId: orderId,
  };

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return showError({ msg: result.message });
    }

    showSuccess({ msg: "Record deleted successfully!" });
    fetchOpenAlgoOrders();
  } catch (e) {
    showError({ msg: "Something went wrong. Unable to delete record!" });
  } finally {
    hideLoader("#open-del-" + btnId, { content: `<i class="fas fa-trash"></i>` });
  }
};

fetchPostions();

// const openTPSLTap = document.querySelector("#nav-open_tpsl_orders-tab");
// const actionsTap = document.querySelector("#nav-actions-tab");

// openTPSLTap.addEventListener("click", async () => {
//   fetchOpenTPSLOrders();
// });

// const fetchOpenTPSLOrders = async () => {
//   const url = "/api/user-management/get_open_tpsl_orders/" + userId;

//   try {
//     const response = await fetch(url);
//     const result = await response.json();

//     if (!result.success) {
//       return showError({ msg: result.message });
//     }

//     const trades = result.data;
//     var tableBody = ``;

//     trades.forEach((trade) => {
//       var direction = "Stop Loss";
//       const stopOrderType = trade.stopOrderType;
//       const createdTime = trade.createdTime;
//       const coinName = trade.symbol;
//       const bybitOrderId = trade.orderId;
//       const quantity = trade.size || trade.qty;
//       const triggerPrice = trade.triggerPrice;

//       if (stopOrderType == "PartialTakeProfit" || stopOrderType == "TakeProfit") {
//         direction = "Take Profit";
//       }

//       tableBody += `
//               <tr>
//                   <td>${coinName}</td>
//                   <td>${direction}</td>
//                   <td>${quantity}</td>
//                   <td>${triggerPrice}</td>
//                   <td><button class="btn btn-danger btn-sm" id="open-tpsl-del-${createdTime}" onclick="initiateOpenTPSLOrderDelete('${createdTime}', '${coinName}', '${bybitOrderId}')"><i class="fas fa-trash"></i></button></td>
//               </tr>
//           `;
//     });

//     $("#open-tpsl-orders-table tbody").html(tableBody);
//     $("#open-tpsl-orders-qty").html(trades.length);
//   } catch (e) {
//     console.log(e);
//     showError({ msg: e.message });
//   }
// };
