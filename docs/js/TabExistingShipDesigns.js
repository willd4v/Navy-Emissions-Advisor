/*
    TabExistings class - extends Tab class

    Author: Hyatt Moore
*/
class TabExistingShipDesigns extends Tab {
  
  constructor(descriptionsObj, ship_fuel_use_dict, fuel_conversions_dict) {
    super(descriptionsObj);
    this.resultsId = "existing-ship-designs-table-results-container";
    this.barChartsId = 'existing-ship-designs-plots';
    this.$barChartsDiv = $('#'+this.barChartsId);
    this.$resultsDiv = $("#"+this.resultsId);
    this.pieChartId = 'pieChart';
    this.$pieChartDiv = $("#"+this.pieChartId);
    this.$warningDiv = $("#existing-ship-designs-warning")
    this.$shipClass = $('#existing-ship-class');
    this.$fuelType = $('#existing-ship-fuel-type');
    this.ship_fuel_use_dict = ship_fuel_use_dict;
    // console.log('ship fuel use')
    // console.log(this.ship_fuel_use_dict)
    this.fuel_conversions_dict = fuel_conversions_dict;
    this.fuelChart = null;
    this.co2Chart = null;
    this.missionChart = null;
    this.buildTab();
    this.updateView();
  }

  //..-----------------------------------------------------------------------------------------..//
  // METHODS (API and helpers)
  //..-----------------------------------------------------------------------------------------..//
  bindEvents() {

  }

  buildTab() {
    const $container = $("#existing-ship-designs-main-view");    

    // Populating ship dropdown
    const $shipDropdown = this.$shipClass
    $shipDropdown.empty(); // remove previous options
    // $shipDropdown.append($('<option>', {
    //   value: "",
    //   text: "Ship",
    //   disabled: true,
    //   selected: true
    // }));

    Object.keys(this.ship_fuel_use_dict).forEach(ship => {
      $shipDropdown.append($('<option>', {
        value: ship,
        text: ship
      }));
    });

    // Populating fuel dropdown
    const $fuelDropdown =this.$fuelType;
    $fuelDropdown.empty(); // remove previous options

    // Check if fuel_conversions_dict is empty
    if (Object.keys(this.fuel_conversions_dict).length === 0) {
      $fuelDropdown.append($('<option>', {
        value: null,
        text: "No Fuel Types Found",
        disabled: true,
        selected: true
      }));
    } else {
      Object.keys(this.fuel_conversions_dict).forEach(fuel => {
        $fuelDropdown.append($('<option>', {
          value: fuel,
          text: fuel
        }));
      });

      // Append "All" option if there is more than one entry
      if (Object.keys(this.fuel_conversions_dict).length > 1) {
        $fuelDropdown.append($('<option>', {
          value: "All",
          text: "All"
        }));
      }
    }

    // Input checks and binding events
    const inputs = ['#percent_underway', '#percent_not_underway', '#percent_cold_iron'];
    inputs.forEach(selector => {
      $container.find(selector).on("input", () => {
        this.checkInputs();
      });
    });

    
    // bind events
    $shipDropdown.on("change", () => this.updateView());
    $fuelDropdown.on("change", () => this.updateView());
    this.bindEvents();
    
  }

  retrieveFormValues() {
    // Retrieve form values using jQuery
    const shipName = this.$shipClass.val();
    const fuelType = this.$fuelType.val();
    const durationDays = parseFloat($('#duration_days').val());
    const percentUnderway = parseFloat($('#percent_underway').val());
    const percentNotUnderway = parseFloat($('#percent_not_underway').val());
    const percentColdIron = parseFloat($('#percent_cold_iron').val());

    // Create a JSON object
    const formData = {
        "shipName": shipName,
        "fuelType": fuelType,
        "durationDays": durationDays,
        "percentUnderway": percentUnderway,
        "percentNotUnderway": percentNotUnderway,
        "percentColdIron": percentColdIron
    };

    return formData;
  }


  hasValidInput(){
    const $container = $("#existing-ship-designs-main-view");
    const underway = parseFloat($container.find("#percent_underway").val());
    const notUnderway = parseFloat($container.find("#percent_not_underway").val());
    const coldIron = parseFloat($container.find("#percent_cold_iron").val());

    return (underway + notUnderway + coldIron == 100);
  }

  checkInputs() {  
    const $container = $("#existing-ship-designs-main-view");
    const underway = parseFloat($container.find("#percent_underway").val());
    const notUnderway = parseFloat($container.find("#percent_not_underway").val());
    const coldIron = parseFloat($container.find("#percent_cold_iron").val());
    let total_percent = underway + notUnderway + coldIron;
    if (total_percent !== 100) {
      // Show error or handle it
      this.hideResults();
      this.$warningDiv.text(`The percentages (${total_percent}%) must total 100.`).show();
    } else {
      this.$warningDiv.text("").hide();
      this.updateView();
    }
  }

  hideResults(){
    this.$resultsDiv.hide();
    this.$pieChartDiv.hide();
    this.$barChartsDiv.hide();
  }
  showResults(){
    this.$resultsDiv.show();
    this.$barChartsDiv.show();
    this.$pieChartDiv.show();

  }
  updateView() {    
    if (this.hasValidInput()){
      let formData = this.retrieveFormValues();       
      /* durationDays: 365
      fuelType: "F76"
      percentColdIron: 0
      percentNotUnderway : 0
      percentUnderway : 100
      shipName : "LHA-6CL"
      */
      let fuelType = 'All';
      let ship_consumption = this.calc_existing_ship_mission_info(formData.shipName, 
        fuelType,
        formData.percentUnderway,
        formData.percentNotUnderway,
        formData.percentColdIron,
        formData.durationDays);  //console.log("ship consumption is", ship_consumption);
      this.$warningDiv.text("");
      console.log('Ship consumption[shipName]')
      console.log(ship_consumption[formData.shipName]);
      //formData.fuelType
      console.log(ship_consumption[formData.shipName][formData.fuelType]);

      let tableData = TabExistingShipDesigns.restructureData(ship_consumption[formData.shipName][formData.fuelType]);
      // this.buildTableWithDictionary(tableData,this.resultsId,formData.shipName)
      // console.log("tableData",tableData);
      let htmlTable = this.generateHtmlTable(tableData, formData.shipName);
      //console.log(htmlTable)
      $("#"+this.resultsId).html(htmlTable);
      this.generateFuelBarChart(ship_consumption[formData.shipName], 'fuelChart');
      this.generateCO2BarChart(ship_consumption[formData.shipName], 'co2Chart');

      if(this.missionChart){
        this.missionChart.destroy();
      }
      const missionData = formData;
      const missionDataArray = [
        {'name':'Underway',     'value': missionData.percentUnderway},
        {'name':'Not Underway', 'value': missionData.percentNotUnderway},
        {'name':'Cold Iron',    'value': missionData.percentColdIron}
      ];
    
      //this.redrawPieChart(missionDataArray, this.pieChartId);
      const mission_days = missionData.durationDays;
      const titleStr = 'Mission days: ' + mission_days
      this.drawD3PieChart(missionDataArray, titleStr, this.pieChartId);
      
      // this.missionChart = this.generateMissionPieChart(formData, 'missionChart');
      this.showResults();
    }
    else{

      // Show error or handle it
      this.hideResults();
      this.$warningDiv.text("The total percentage should be 100.").show();
    }
  }

  drawD3PieChart(dataArray, titleStr, htmlId){
    //let $pieChart = (htmlId != null) ? $("#" + htmlId) : this.$pieChartDiv;
    let containerId = (htmlId != null) ? "#" + htmlId : this.$pieChartDiv;
    return generateD3PieChart(dataArray, containerId, titleStr);
  }

  redrawPieChart(missionDataArray, htmlId) {
    let $pieChart = (htmlId != null) ? $("#" + htmlId) : this.$pieChartDiv;
    // let $pieChart =this.$pieChartDiv;
    // if(htmlId != null){
    //   $pieChart = $("#"+htmlId);        
    // }

    // Clear the existing content of the div
    $pieChart.empty();
  
    // Draw the pie chart and append the new SVG node
    // const svgNode = pieChart(missionDataArray);
    const svgNode = pieChartAsPercentages(missionDataArray);
    console.log("svgNode");
    console.log(svgNode);
    $pieChart.append(svgNode);
  }
  
  generateMissionPieChart(missionData, htmlId){
    // Assuming these variables are set up similarly to the Python code:
    
    const op_percentages = [missionData.percentUnderway, missionData.percentNotUnderway];
    const op_names = ['Underway', 'Not Underway'];
    const colors = ['lightseagreen', 'peru'];
    const explode_pie = [0, 0.1];
    const mission_days = missionData.durationDays;

    const border_props = {
        // You might need to adjust this based on what `border_props` was in your Python code
        borderColor: 'white',
        borderWidth: 2
    };

    const ctx = document.getElementById(htmlId).getContext('2d');

    return new Chart(ctx, {
      type: 'doughnut',
      //type: 'pie',
      data: {
          datasets: [{
              data: op_percentages,
              backgroundColor: colors,
              borderColor: border_props.borderColor,
              borderWidth: border_props.borderWidth,
              // Chart.js doesn't natively support 'explode', but there are workarounds online if needed
          }],
          labels: op_names,
          position: 'right'
      },     
      options: {
          responsive: true,
          plugins: {
            labels: op_names,
            title: {
              display: true,
              text: 'Mission days: ' + mission_days
            },          
            legend: {
              display: true,
              position:'right'
            },

            tooltips: {
              callbacks: {
                  label: function(tooltipItem, data) {
                      const dataset = data.datasets[tooltipItem.datasetIndex];
                      const currentValue = dataset.data[tooltipItem.index];
                      const percentage = parseFloat((currentValue / dataset._meta[0].total * 100).toFixed(1));
                      return `${op_names[tooltipItem.index]}: ${percentage}%`;
                  }
              }
            },
            datalabels: {
              formatter: (value, ctx) => {
                  let sum = 0;
                  let dataArr = ctx.chart.data.datasets[0].data;
                  dataArr.map(data => {
                      sum += data;
                  });
                let percentage = (value * 100 / sum).toFixed(1) + "%";
                  return percentage;
              },
              color: '#fff',  // Adjust this to the color you prefer
            }
          }
      },
      plugin: [{
        id: 'my-doughnut-text-plugin',
        afterDraw: function (chart, option) {
            let theCenterText = "50%" ;
            const canvasBounds = canvas.getBoundingClientRect();
            const fontSz = Math.floor( canvasBounds.height * 0.10 ) ;
            chart.ctx.textBaseline = 'middle';
            //chart.ctx.textAlign = 'center';
            //chart.ctx.font = fontSz+'px Arial';
            chart.ctx.fillText(theCenterText, canvasBounds.width/2, canvasBounds.height*0.70 )
        }
      }],
    });
  }

  generateBarChart(shipConsumption, htmlId, label_prefix, yLabel){
    // BBL Chart
    const labels = ["Underway","Not Underway"].map(label => label_prefix.toUpperCase() + " "+ label);
    // Different colors for the different fuel types
    const fuelTypeColors = ['lightseagreen', 'blue', 'red', 'orange', 'purple', 'yellow']; // Add more colors if there are more fuel types
    const bblCtx = document.getElementById(htmlId).getContext('2d');
    return new Chart(
      bblCtx, // argument 1
      { //argument 2
        type: 'bar', 
        data: {
            labels: labels,
            datasets: Object.entries(shipConsumption).map(([fuelType, values], index) => ({
              label: this.getDescription(fuelType),
              data: [values[label_prefix.toLowerCase()+'_underway']/1000, values[label_prefix.toLowerCase()+'_not_underway']/1000],
              backgroundColor: fuelTypeColors[index],
              borderColor: 'black',
              borderWidth: 1
          }))   
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: yLabel
              },
              grid: {
                color: 'lightgray',
                borderColor: 'white',
                borderWidth: 1
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 15,
                    boxHeight: 15,
                    usePointStyle: true,
                    color: 'black',
                    padding: 5,
                    title: {
                        display: false
                    }
                },
                fullSize: false,
                onHover: null
            }
          },
          layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
          }
        },
        plugins: [{
          id: 'custom_canvas_background_color',
          beforeDraw: (chart) => {
              const ctx = chart.canvas.getContext('2d');
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.lineWidth = 2;
              ctx.strokeStyle = 'black';
              ctx.strokeRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
        }]
      }
    ); // end return
  }  // end function

  generateCO2BarChart(shipConsumption){
    const yLabel = "CO2 Emitted (1/1000 tons)";
    if(this.co2Chart){
      this.co2Chart.destroy();
    }
    this.co2Chart = this.generateBarChart(shipConsumption, 'co2Chart', 'co2', yLabel);
  }

  generateFuelBarChart(shipConsumption){
    const yLabel = "BBL Consumed (1/1000 barrels)";
    if(this.fuelChart){
      this.fuelChart.destroy();
    }
    this.fuelChart = this.generateBarChart(shipConsumption, 'fuelChart', 'bbl', yLabel);
  }

  
  
  generateFuelBarChartOld(){
    //let tableData = TabExistingShipDesigns.restructureData(shipConsumption[fuelType]);
      
    // let underway = 0.5;
    // let not_underway = 0.5;
    // const fuel_types = Object.keys(shipConsumption); //['F76', 'Ethanol', 'LPG', 'Methanol'];
    // const bbl_values = [[101587.97, 14241.66], [171196.44, 24000.1], [96301.04, 13500.48], [203623.91, 28546.12]];
    // const co2_values = [[18993.0, 12425.64], [35904.24, 23489.34], [34180.38, 22361.55], [28988.58, 18964.96]];
    // const op_percentages = [underway*100, not_underway*100];  // Assuming underway and not_underway variables are declared elsewhere

    // BBL Chart
    // Different colors for the different fuel types
    const fuelTypeColors = ['lightseagreen', 'blue', 'red', 'orange', 'purple', 'yellow']; // Add more colors if there are more fuel types
    const bblCtx = document.getElementById(htmlId).getContext('2d');
    new Chart(bblCtx, {
      type: 'bar',
      
      data: {
          labels: ["BBL Underway", "BBL Not Underway"],
          datasets: Object.entries(shipConsumption).map(([fuelType, values], index) => ({
            label: this.getDescription(fuelType),
            data: [values['bbl_underway']/1000, values['bbl_not_underway']/1000],
            backgroundColor: fuelTypeColors[index],
            borderColor: 'black',
            borderWidth: 1
        }))      
      //     datasets: fuel_types.map((fuelType, index) => ({
      //       label: this.getDescription(fuelType),
      //       data: bbl_values[index].map(value => value / 1000),
      //       backgroundColor: fuelTypeColors[index],
      //       borderColor: 'black',
      //       borderWidth: 1
      //   }))
      // },
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: 'BBL Consumed (1/1000 Barrels)'
                  },
                  grid: {
                      color: 'lightgray',
                      borderColor: 'white',
                      borderWidth: 1
                  }
              },
              x: {
                  grid: {
                      display: false
                  }
              }
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 15,
                    boxHeight: 15,
                    usePointStyle: true,
                    color: 'black',
                    padding: 5,
                    title: {
                        display: false
                    }
                },
                fullSize: false,
                onHover: null
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        }
    },
    plugins: [{
        id: 'custom_canvas_background_color',
        beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.strokeRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }]
});




    // const bblCtx = document.getElementById('fuelChart').getContext('2d');
    // new Chart(bblCtx, {
    //     type: 'bar',
    //     data: {
    //         labels: ["BBL Underway", "BBL Not Underway"],
    //         datasets: fuel_types.map((fuelType, index) => ({
    //             label: this.getDescription(fuelType),
    //             data: bbl_values[index].map(value => value / 1000),
    //             backgroundColor: 'lightseagreen', 
    //             borderColor: 'black',
    //             borderWidth: 1
    //         }))
    //     }
    // });
  }

  generateHtmlTable(data, optionalTableName){
    //let html = '<table border="1">';
    
    // Table header
    // let html = "<div/>"+`<caption><h4>${optionalTableName}</h4></caption>`
    let html = "<div/>"
    html+="<table class='table table-striped table-hover table-first-column-as-th'>"
    
    html += '<thead><tr><th></th><th>BBL fuel</th><th>CO2 emitted</th></tr></thead><tbody>';
    
    // Table body
    for (let key in data) {
      let values = {
        fuel: data[key]['BBL fuel'],
        co2: data[key]['CO2 emitted']
      };
    
      for (let [property, value] of Object.entries(values)) {
        if (isNumeric(value)) {
          if (value.toString().includes(".")) {
            values[property] = parseFloat(Number.parseFloat(value).toFixed(2));
          }
          else if (value==0){
            values[property] = '0.00';
          }
        }
      }
      key = this.getDescription(key);
      html += `<tr><td>${key}</td><td>${values.fuel}</td><td>${values.co2}</td></tr>`;

    }

    html += '</tbody></table>';

    return html;
  }
  
  static restructureData(data) {
    return {
        'Underway': {
            'BBL fuel': data.bbl_underway,
            'CO2 emitted': data.co2_underway
        },
        'Not Underway': {
            'BBL fuel': data.bbl_not_underway,
            'CO2 emitted': data.co2_not_underway
        },
        'Cold Iron': {
            'BBL fuel': data.bbl_cold_iron,
            'CO2 emitted': data.co2_cold_iron
        },
        'Total': {
            'BBL fuel': data.total_bbl_consumed,
            'CO2 emitted': data.total_co2_emitted
        }
    };
}


  calc_existing_ship_mission_info(
    ship_name,
    fuel_type,
    percent_underway,
    percent_not_underway,
    percent_cold_iron,
    mission_days = 365.25
  ) {
    const values_dict = this.ship_fuel_use_dict;          // console.log("ship values: " + JSON.stringify(values_dict));
    const fuel_conversions = this.fuel_conversions_dict;  //{'fuel_type':{"fuel_density": fuel_density, "bbl_to_co2": bbl_to_co2}, ...}
    const ship_results = {};

    const mission_hours_div_pct = mission_days*0.24; // Note: 24 hours / 100 is 0.24   and we have all over percent_<tags> as percentages (%) which needed to be converted to [0, 1] 
    const hours_underway = percent_underway * mission_hours_div_pct; 
    const hours_not_underway = percent_not_underway * mission_hours_div_pct; 
    const hours_cold_iron = percent_cold_iron * mission_hours_div_pct; 
  
    // console.log(JSON.stringify(fuel_conversions));
    if (ship_name in values_dict) {
      // does calculation for *1 ship: 1 fuel &  1 ship: all fuel
      const ship_data = values_dict[ship_name];      
  
      if (fuel_type.toLowerCase() === "all") {
        ship_results[ship_name] = {};
        for (const [specific_fuel_type, {fuel_density, bbl_to_co2}] of Object.entries(fuel_conversions)) {
          ship_results[ship_name][specific_fuel_type] = calculate_fuel_and_emissions(
            fuel_density,
            bbl_to_co2,
            hours_underway,
            hours_not_underway,
            hours_cold_iron,
            ship_data
          );
        }        
      } else {
        //(fuel_type in fuel_density);
        const density = fuel_conversions[fuel_type]["fuel_density"];
        const conversion = fuel_conversions[fuel_type]["bbl_to_co2"];
        ship_results[ship_name] = {};
        ship_results[ship_name][fuel_type] = calculate_fuel_and_emissions(
          density,
          conversion,
          hours_underway,
          hours_not_underway,
          hours_cold_iron,
          ship_data
        );        
      }
    } else if (ship_name.toLowerCase() === "all") {
      for (ship in values_dict) {
        ship_results[ship] = {};
        const ship_data = values_dict[ship];
  
        if (fuel_type.toLowerCase() === "all") {
          for (const [fuel, density] of Object.entries(fuel_density)) {
            const conversion = bbl_to_co2[fuel] || 0;
            ship_results[ship][fuel] = calculate_fuel_and_emissions(
              density,
              conversion,
              hours_underway,
              hours_not_underway,
              hours_cold_iron,
              ship_data
            );
          }          
        } else if (fuel_type in fuel_density) {
          const density = fuel_density[fuel_type];
          const conversion = bbl_to_co2[fuel_type];
          ship_results[ship][fuel_type] = calculate_fuel_and_emissions(
            density,
            conversion,
            hours_underway,
            hours_not_underway,
            hours_cold_iron,            
            ship_data
          );      
        }
      }      
    }
    return ship_results;
  }
  
}
