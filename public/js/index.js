// ----------------------- Loading Content ----------------------------------
const addLoader = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Adding...`;

const generalLoader = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;

// ------------------------- Utility Methods --------------------------------------------

const showSuccess = (data) => {
  toastr.success(data.msg);
};

const showError = (data) => {
  toastr.error(data.msg);
};

const showModal = (modalId) => {
  $("label.error").hide();
  $(".error").removeClass("error");
  $("#" + modalId).modal("show");
};

const closeModal = (modalId) => {
  $("#" + modalId).modal("hide");
};

const showLoader = (selector, data) => {
  const element = document.querySelector(selector);
  element.disabled = true;
  element.innerHTML = data.content;
};

const hideLoader = (selector, data) => {
  const element = document.querySelector(selector);
  element.disabled = false;
  element.innerHTML = data.content;
};
