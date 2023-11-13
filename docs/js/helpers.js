// Creates the component spec list in the body of expanded component accordions
// Gets value of cookie for input name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const deleteCookie = (name) => {
  const cookie = getCookie(name);
  if (cookie) {
    document.cookie = `${name}= ; expires = Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

const clearSession = () => {
  alert("Your authentication token has expired. You will now be redirected to login again.")
  deleteCookie("jwt");
  window.location.replace(window.location.origin + URLS["login"]);
};


// Closes a confirm delete modal
// Can only be called from an event handler (hence the event passed in parameter)
// Expects target element to have data-tabname property
const closeConfirmDeleteModal = (e) => {
  const tabName = e.target.dataset.tabname;
  $(`#delete-${tabName}-btn`).off();
  $(`#delete-${tabName}-btn`).unbind();
  $(`#delete-${tabName}-btn`).removeData();
  $(`#confirm-delete-${tabName}-modal`).modal('hide');
}

const closeCreateNewModal = (e) => {
  const tabName = e.target.dataset.tabname;
  $(`#new-${tabName}-specs`).empty();
  $(`#new-${tabName}-form`)[0].reset();
  $(`#new-${tabName}-modal`).modal('hide');
  $(`#new-${tabName}-error-alert`).hide();
}

const closeErrorAlert = (e) => {
  $(e.target).parent().remove();
}

const openErrorAlert = (parentElId, message) => {
  $(parentElId).append(`
    <div class="alert alert-danger alert-dismissible" role="alert">
      <span clas="text">${message}</span>
      <button type="button" class="btn-close" aria-label="Close" onClick="closeErrorAlert(event)"></button>
    </div>
  `);
};

// Displays a green toast in the bottom right-hand corner of screen
const displayToastMessage = (message) => {
  $('#global-toast .toast-text').text(message);
  $('#global-toast').toast('show');
};


// Takes a tabName (e.g. "simulate"), and returns an object of data from the tab's form.
const getValuesFromForm = (formEl) => {
  const _formInputEls = $(formEl).find(":input:not(:submit):input:not(:button)");
  let data = {};
  _formInputEls.each((i, el) => {
    const name = el.dataset.name;
    data[name] = el.value;
  });
  return data;
}

const preventDecimal = (el, e) => {
  // Ignore delete and backspace keys
  if (e.keyCode === 46) {
    e.preventDefault();
    return;
  }  
}

const enableEdit = (e) => {
  const parentEl = $(e.target).parent().parent();
  $(parentEl).find(".display-container").hide();
  $(parentEl).find(".edit-container").show();
};

const disableEdit = (e) => {
  const parentEl = $(e.target).parent().parent();
  $(parentEl).find(".display-container").show();
  $(parentEl).find(".edit-container").hide();
};



// Creates a form with an onsubmit event and a single input
// id: and ID that will be passed to the form's data-id attributes
// parentElId: the ID of the element the form will be placed
// text: the input's value
// submitCallback: the function to be called onSubmit
// type: either "name" or "description"
const createFormWithEvents = (id, parentElId, text, submitCallback, type, list, title) => {
  const $form = $(`<form data-id="${id}"></form>`);
  let element = null;

  if (type === "description") {
    element = createDescriptionEdit(text);
  }

  if (type === "name") {
    element = createNameEdit(text);
  }

  if (type === "list") {
    element = createListEdit(list, title, id)
  }

  $form.append(element);

  $form.submit((e) => {
    $(e.target).find(".display-container").show();
    $(e.target).find(".edit-container").hide();
    submitCallback(e);
  });

  $(parentElId).append($form);

};


const isNumeric = (str) => {
  if (typeof str === "number") return true;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

// Handles collapsing/expanding main mobile navigation
const toggleMobileToolNavMenu = (el, e) => {
  const navMenu = $("#tool-navigation");
  if (navMenu.hasClass("show-nav-dropdown")) {
    navMenu.removeClass("show-nav-dropdown");
  }
  else {
    navMenu.addClass("show-nav-dropdown");
  }
}