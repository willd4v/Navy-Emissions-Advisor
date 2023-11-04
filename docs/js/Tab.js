/*
    Abstract Class for tabs
    Construction requires an HTML element ID.  Optional arguments include dataset and SVG dimensions.
    Objects should be configured before calling setData, which will otherwise kick off a rendering using the current, possibly default settings.
    Action methods        
        - setData - prepares and stored input dataset, prepares the SVG content invokes render method.
        - render - Renders the SVG content associated with the dataset.           

    Author: Hyatt Moore
*/
// Ref: https://github.com/d3/d3-time-format and https://d3-wiki.readthedocs.io/zh_CN/master/Time-Formatting/


class Tab {
  constructor(descriptionsObj){        
    this.descriptionsObj = descriptionsObj // dictionary of key to readable descriptions
    
  }


  //..-----------------------------------------------------------------------------------------..//
  // METHODS (frontend and helpers)
  //..-----------------------------------------------------------------------------------------..//

  buildTab() {
    throw new Error("buildTab must be implemented by inheriting class")
  }

  getDescription(key){
    return this.descriptionsObj[key]?this.descriptionsObj[key]:key
  }


  //..-----------------------------------------------------------------------------------------..//
  // METHODS (Widget callbacks and helper fcns)
  //..-----------------------------------------------------------------------------------------..//
  buildTableWithDictionary(tableData, divID, optionalTableName) {
    console.log("Table data:", JSON.stringify(tableData))
    let jqDiv = $("#"+divID+"")
    //let html = "<h1>"+optionalTableName+"</h1>"
    let html = "<div/>"+`<caption><h4>${optionalTableName}</h4></caption>`
    html+="<table class='table table-striped table-hover'>"
    for (let [key, value] of Object.entries(tableData)) {
      const regex = /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2})/;
      const dateMatch = value.toString().match(regex);

      if (dateMatch) {
        value = dateMatch[1];
      }

      else if (isNumeric(value)) {
        if (value.toString().includes(".")) {
          value = parseFloat(Number.parseFloat(value).toFixed(2));
        }
      }
      key = this.getDescription(key);
      html+=`<tr><td>${key}</td><td>${value}</td></tr>`
    }
    html+="</table>"
    jqDiv.html(html)
  }


  static buildTableWithHtmlRows(htmlRows, divID, optionalTableName) {
    let jqDiv = $("#"+divID+"")    
    let html = "<div/>"+`<caption>${optionalTableName}</caption>`
    html += "<table class='table table-striped table-hover'>"
    html += htmlRows    
    html += "</table>"
    jqDiv.html(html)    
  }

  static buildTableFromArray(dataArray, divID, optionalTableName, optionalColLabels, maxRows){
    let jqDiv = $("#"+divID)
    let html = "<div/>"+`<caption>${optionalTableName}</caption>`
    html += "<table class='table table-striped table-hover'>"

    if(optionalColLabels){
      console.log('optional col labels', optionalColLabels)
      html+="<thead><tr>"
      for(let label of optionalColLabels){
        console.log(label)
        html+="<td>"+label+"</td>"
      }
      html+="</tr></thead>"
    }
    html+="<tbody>"

    if(!maxRows){
      maxRows = Infinity
    }
    let curRow = 0
    dataArray.every(row=>{
      if(++curRow > maxRows){
        return false
      }
      html += "<tr>"
      row.forEach(col => {        
        html += "<td>"+col+"</td>"        
      })
      html += "</tr>"
      return true
    })
    html += "</tbody></table>"
    jqDiv.html(html)
  }


}


//..-----------------------------------------------------------------------------------------..//
// Widget "skins"
//..-----------------------------------------------------------------------------------------..//

function buildTemplateTab(descriptionsObj, idsToSkip) {

  designPromise = d3.json(URLS['<template_id>']);    

  designPromise.then(
    promisedValue =>{
      // console.log('Received rightsize design data', promisedValue)          
      let rightsizeValues = promisedValue.data.output
      // for example: b_charge_level, b_charge_power, b_discharge_power, b_energy
      // dg_peak_cons_rate, dg_power
      // pv_power
      let rightsizeParametersObj = promisedValue.data.parameters
      // for example: b_charge_eff, b_discharge_eff, b_max_soc, b_min_soc
      // dg_load, dg_min_lod, dg_startup_delay
      // loc, startdatetime
      // wt_availability, wt_capacity, wt_power
      
      refreshGraph(rightsizeValues, rightsizeParametersObj)

      let container = $("#staticParameters")

      for ([idStr, value] of Object.entries(rightsizeParametersObj)) {
        label = descriptionsObj[idStr]?descriptionsObj[idStr]:idStr // if it isn't in the description, then just use the idStr tag for the label
        if (!idsToSkip.includes(idStr)) {
          // Otherwise it is not displayed
          if (value === 0) {
            value = "0"
          }
          html = buildShadowWidgetSetE(idStr, label, value, idsToSkip)
          // console.log(idStr, label, value)
          container.append(html)
  
          // This avoids issues with trying to copy/clone later by building up vars together, here.
          lastUsedSettings[idStr] = value
          currentUserSettings[idStr] = value
        }
      }      
      // console.log(rightsizeParametersObj)
    },
    ()=>{
      console.log('Warning - rightsize design data was not received'); 
      let queryUrl = URLS['rightsize_design']
      $.get(queryUrl, errMsg => { 
        alert('Query failed: '+ errMsg);
        console.log('Query failed.  Received the following from the server:' + errMsg);
      })
    }
  )
}

function buildShadowWidgetSetE(idStr, componentStr, defaultValue, idsToSkip) {
  // const idsToSkip = this.fieldsToHide //   //['wt_power', 'wt_capacity']
  value = defaultValue ? defaultValue : ''
  if(idStr=="startdatetime"){    
    return `
    <div class="row mb-1">
      <div class="col-2 gy-0">
        <input type="text" class="col-12" disabled id="shadow_${idStr}" aria-describedby="shadow_${idStr}-help" value="${value}">
      </div>
      <div id="shadow_${idStr}-help" class="col-3 gx-0 form-text">${componentStr}</div>      
    </div>
    `;
  }
  else if (!idsToSkip.includes(idStr)){
    return `    
    <div class="row mb-1">
      <div class="col-1 gy-0">
        <input type="text" class="col-12" disabled id="shadow_${idStr}" aria-describedby="shadow_${idStr}-help" value="${value}">
      </div>
      <div id="shadow_${idStr}-help" class="col-3 gx-0 form-text">${componentStr}</div>
    </div>
    `;
  }
  else{
    return "";
  }
}

function buildWidgetSetA(idStr, componentStr, defaultValue) {
  value = defaultValue ? defaultValue : ''
  return `
    <div class='row g-3'>
      <div class='form-floating mb-1'>
        <input type='text' class='form-control' id='${idStr}' placeholder='${value}' value='${value}'>
        <label for='${idStr}'>${componentStr}</label>
        </div>
    </div>
  `;
}

function buildWidgetSetB(idStr, componentStr, defaultValue) {
  value = defaultValue ? defaultValue : ''
  return `
  <div class="form-floating mb-3">
    <div class="col-auto gy-0">
      <input type="text" class="form-control" id="${idStr}" aria-describedby="${idStr}-help" value="${value}">
      <div id="${idStr}-help" class="form-text">${componentStr}</div>
    </div>
  </div>
  `;
}

function buildWidgetSetC(idStr, componentStr, defaultValue) {
  value = defaultValue ? defaultValue : ''
  return `
  <div class="form-floating mb-3">
    <div class="col-auto gy-0">
      <div id="${idStr}-help" class="form-text">${componentStr}</div>
      <input type="text" class="form-control" id="${idStr}" aria-describedby="${idStr}-help" value="${value}">
    </div>
  </div>
  `;
}

function buildWidgetSetD(idStr, componentStr, defaultValue) {
  value = defaultValue ? defaultValue : ''
  return `
  <div class="form-floating">
      <input maxlength=4 size=3 type="text" id="${idStr}" aria-describedby="${idStr}-help" value="${value}">
      ${componentStr}
  </div>
  `;
}

function buildWidgetSetE(idStr, componentStr, defaultValue) {
  value = defaultValue ? defaultValue : ''
  if(idStr.endsWith("startdatetime")){
    return `
    <div class="row mb-1">
      <div class="col-5">
        <input type="text" class="col-12" id="${idStr}" aria-describedby="${idStr}-help" value="${value}">
      </div>
      <div id="${idStr}-help" class="col-7 gx-0 form-text">${componentStr}</div>
    </div>
    `;
  }
  else{
    return `
    <div class="row mb-1">
      <div class="col-3 gy-0">
        <input type="text" class="col-12" id="${idStr}" aria-describedby="${idStr}-help" value="${value}">
      </div>
      <div id="${idStr}-help" class="col-9 gx-0 form-text">${componentStr}</div>
    </div>
    `;
  }
}



// From https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/#bettermixinsthroughclassexpressions
var mix = (superclass) => new MixinBuilder(superclass);
// function mix(superclass){
//   return new MixinBuilder(superclass);
// }
class MixinBuilder {
  constructor(superclass) {
    this.superclass = superclass;
  }

  with(...mixins) { 
    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
  }
}

// Use in practice like so:
// class MyClass extends mix(MyBaseClass).with(Mixin1, Mixin2) {
  /* ... */
//}
