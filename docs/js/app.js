var tabsObj = Object();
var globalView;
let data = {};
var URLS = Object();

// Match these with the .html file names which are something like
// tab_<tabname>.html
const tabname_existing_ship_designs = "existing_ship_designs";
const tabname_new_ship_designs = "new_ship_designs";
const default_tabname = tabname_existing_ship_designs;

// What we get from the url
const initialQueryStr = window.location.search;

$(initApp); // shorthand for  $(document).ready();

function initApp() {
  const server_prefix = "";

  // Check for role to apply guest styling
  const role = $("#session-role").text();
  if (role === "Guest") {
    $("body").addClass("guest");
  }

  // generate the tab html shells
  const appOptions = JSON.parse(loadFile(server_prefix + "data/config.json"));
  URLS["login"] = appOptions.url.login;
  URLS["FUEL_CONSUMPTION"] = appOptions.url.FUEL_CONSUMPTION;
  URLS["FUEL_CONVERSIONS"] = appOptions.url.FUEL_CONVERSIONS;
  
  
  const tab_names = [tabname_existing_ship_designs, tabname_new_ship_designs];

  tab_names.forEach((name, i) => {
    //const title = appOptions
    //const title = name[0].toUpperCase() + name.slice(1);
    /*
      Here's what's happening in the code:
      appOptions.descriptions?.[name]: This will attempt to access the name property of appOptions.descriptions. If appOptions.descriptions is null or undefined, it won't throw an error; instead, it will immediately return undefined.
      ??: The nullish coalescing operator checks if the value on its left is null or undefined. If it is, it uses the value on its right. If it's not, it uses the value on its left.
      This way, if appOptions.descriptions?.[name] is not null or undefined, title will be set to that value. Otherwise, it'll use the capitalized name.
    */
    const title = appOptions.descriptions?.[name] ?? (name[0].toUpperCase() + name.slice(1));

    const tab = `<div 
        class="nav-item" 
        id="nav-${name}-tab" 
        data-bs-toggle="tab" 
        data-title="${title}" 
        data-bs-target="#${name}-tab" 
        type="button" 
        role="tab"
        aria-controls="nav-${name}"
        onclick="toggleMobileToolNavMenu(this, event)">
          <span>${title}</span>
          <i class="bi bi-caret-right"></i>
          <i class="bi bi-caret-down"></i>
        </div>`;
    $("#nav-tab").append(tab);

    let html_url = server_prefix + "html/tab_" + name + ".html";
    let tab_html = loadFile(html_url);
    $("#" + name + "-tab").prepend(tab_html);
    tabsObj[name] = null;
  });

  Promise.all([
    get_csv_as_dict(URLS["FUEL_CONVERSIONS"]),
    get_csv_as_dict(URLS["FUEL_CONSUMPTION"])
  ])
  .then(([fuel_conversions_dict, ship_fuel_use_dict]) => {
      //console.log("Fetched fuel conversions dictionary:", fuel_conversions_dict);
      //console.log("Fetched ship fuel use dictionary:", ship_fuel_use_dict);

      const instance = new TabExistingShipDesigns(appOptions.descriptions, ship_fuel_use_dict, fuel_conversions_dict);
      tabsObj[tabname_existing_ship_designs] = instance;
      return instance;
  })
  .then(instance => {
    console.log('All done');
  })
  .catch(error => {
      console.error("Failed to fetch or process the data:", error);
  });

  tabsObj[tabname_new_ship_designs] = new TabNewShipDesigns(tabname_new_ship_designs);
  $("#nav-tab .nav-link").on("show.bs.tab", refreshTabTitle);

  setCurrentTab();

  // On first load, hide mobile nav:
  $("#tool-navigation").removeClass("show-nav-dropdown");
}

// see https://stackoverflow.com/questions/36921947/read-a-server-side-file-using-javascript
function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status == 200) {
    result = xmlhttp.responseText;
  }
  return result;
}

// triggers a mouse click on the desired tab
function setCurrentTab(tabName) {
  if (!tabName) {
    tabName = new URL(window.location).searchParams.get("view");
  }
  if (!tabName) {
    tabName = default_tabname;
  }
  let navID = "#nav-" + tabName + "-tab";
  $(navID).trigger("click");
}

function refreshTabTitle(evt) {
  if (evt) {
    var id = evt.target.id;
  } else {
    var id = $("#nav-tab .nav-link[aria-selected=true]").attr("id");
  }
  $("#nav-current-title").html($("#" + id).attr("data-title"));
  globalView = id.split("-")[1];
  
}
