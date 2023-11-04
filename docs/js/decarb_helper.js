async function get_csv_as_dict(csv_url) {
  const csvDict = {};

  try {
      const response = await fetch(csv_url);
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const data = await response.text();

      const csvData = data.trim().split("\n");
      const headerNames = csvData[0].split(",");

      csvData.slice(1).forEach(row => {
          const columns = row.split(",");
          const csvKey = columns[0].trim();
          const csvData = {};

          for (let i = 1; i < headerNames.length; i++) {
              csvData[headerNames[i].trim()] = parseFloat(columns[i]);
          }
          csvDict[csvKey] = csvData;
      });

  } catch (error) {
      console.error("Failed to fetch or parse the CSV:", error);
  }

  return csvDict;
}

function calculate_fuel_and_emissions(
  density = 0,
  conversion = 0,
  hours_underway = 0,
  hours_not_underway = 0,
  hours_cold_iron = 0,
  {
    x_underway = 0,
    x_not_underway = 0,
    x_cold_iron = 0,
    b_underway = 0,
    b_not_underway = 0,
    b_cold_iron = 0,
    optimum = 0,
    worst = 0    
  }){
    // mission_days = 365,
    // DAYS_PER_YEAR = 365,
    // hours_year = 8760,
    const DAYS_PER_YEAR = 365.25;
    const LBS_TO_TONS = 0.0005;
    const total_hours = hours_underway + hours_not_underway + hours_cold_iron;
    const mission_days = total_hours / 24;

    const bbl_underway = (hours_underway * x_underway + b_underway) / density;
    const bbl_not_underway = (hours_not_underway * x_not_underway + b_not_underway) / density;
    const bbl_cold_iron = (hours_cold_iron * x_cold_iron + b_cold_iron) / density;
    const total_bbl_consumed = bbl_underway + bbl_not_underway + bbl_cold_iron;

    const co2_underway = ((hours_underway * x_underway + b_underway) / density) * conversion * LBS_TO_TONS;
    const co2_not_underway = ((hours_not_underway * x_not_underway + b_not_underway) / density) * conversion * LBS_TO_TONS;
    const  co2_cold_iron = ((hours_cold_iron * x_cold_iron + b_cold_iron) / density) * conversion * LBS_TO_TONS;

    const total_co2_emitted = co2_underway + co2_not_underway + co2_cold_iron;
    const optimum_range = ((hours_underway * x_underway + b_underway) / density) * optimum;
    const worst_range= ((hours_underway * x_underway + b_underway) / density) * worst || 0

    const optimum_co2 = (co2_not_underway / optimum_range) || 0;   // IS THIS CORRECT?  Should it be co2_underway?
    const worst_co2 = ((((hours_underway * x_underway + b_cold_iron) / density) * conversion * LBS_TO_TONS) / worst_range) || 0;  // Is this correct?  why the mix and match of x_underway and b_cold_iron?

    const co2_mission = total_co2_emitted * (mission_days / DAYS_PER_YEAR);
  
    const results = {
      bbl_underway: bbl_underway,     
      bbl_not_underway: bbl_not_underway,
      bbl_cold_iron: bbl_cold_iron,
      total_bbl_consumed: total_bbl_consumed,
      co2_underway: co2_underway,
      co2_not_underway: co2_not_underway,
      co2_cold_iron: co2_cold_iron,
      total_co2_emitted: total_co2_emitted,
      optimum_range: optimum_range,
      worst_range: worst_range,
      optimum_co2: optimum_co2,
      worst_co2: worst_co2,
      co2_mission: co2_mission
    };

  return results;
}

//..-----------------------------------------------------------------------------------------..//
// Returns true if any key in paramObj1 has a matching key in paramObj2 and the values for these
// keys are different between paramObj1 and paramObj2.
function areParameterValuesDifferent(paramObj1, paramObj2) {
  for (const [key, value] of Object.entries(paramObj1)) {
    if (key in paramObj2) {
      if (paramObj2[key] != value) {
        return true;
      }
    }
  }
  return false;
}

//..-----------------------------------------------------------------------------------------..//
function labelValue(label, value) {
  return { label: label, value: value };
}

function generateD3PieChart(dataArray, containerId, titleStr) {

  const container = d3.select(containerId);
  let svg = container.select("svg");
  let gPaths = svg.select(".paths-group");
  let gTexts = svg.select(".texts-group");

  // If the SVG doesn't exist, create it
  if (svg.empty()) {
      svg = container.append("svg")
          .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");
      gPaths = svg.append("g").attr("class", "paths-group").attr("stroke", "white");
      gTexts = svg.append("g").attr("class", "texts-group").attr("text-anchor", "middle");
  }

  const width = container.node().getBoundingClientRect().width;
  const height = Math.min(width, 500);

  console.log('Width',width)
  console.log('Height',height)
  
  const color = d3.scaleOrdinal()
      .domain(dataArray.map(d => d.name))
      .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), dataArray.length).reverse());

  const pie = d3.pie()
      .sort(null)
      .value(d => d.value);

  const innerRadius = Math.min(width, height)/5;
  const outerRadius = Math.max(Math.min(width, height) / 2 - 1, innerRadius);
  const titleOffset = outerRadius * 0.15; // Adjust this percentage for your needs.


  const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  let filteredData = dataArray.filter(d => d.value > 0);
  const arcs = pie(filteredData);
        
  // const arcs = pie(dataArray);
 
  // svg.attr("width", width)
  //    .attr("height", height)
  //    .attr("viewBox", [-width / 2, -height / 2, width, height]);

  // need to account for my title though
  const titleSpace = titleOffset; // Space in user units to accommodate the title
  svg.attr("width", width)
     .attr("height", height + titleSpace) // Increase the height to make space for the title
     .attr("viewBox", [-width / 2, -height / 2, width, height + titleOffset*1.5]);
 
  // Updating paths
  const paths = gPaths.selectAll("path")
      .data(arcs);

  paths.enter().append("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
      .merge(paths)
      .transition() // Optional: for smooth transition
      .duration(1000)
      .attrTween("d", function(d) {
          const i = d3.interpolate(this._current, d);
          this._current = i(0);
          return function(t) {
              return arc(i(t));
          };
      });

  paths.exit().remove();

  // Updating texts
  const totalValue = d3.sum(filteredData, d => d.value);
  const texts = gTexts.selectAll("text")
      .data(arcs);

  texts.enter().append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .each(function(d) {
          const textElem = d3.select(this);
          textElem.append("tspan")
              .attr("y", "-0.4em")
              .attr("font-weight", "bold")
              .text(d.data.name);
          textElem.append("tspan")
              .attr("x", 0)
              .attr("y", "0.7em")
              .attr("fill-opacity", 0.7)
              .text(`${((d.data.value / totalValue) * 100).toFixed(2)} %`);
      })
      .merge(texts)
      .transition() // Optional: for smooth transition
      .duration(1000)
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .select("tspan:last-child")
      .text(d => `${((d.data.value / totalValue) * 100).toFixed(1)} %`);
  
  texts.exit().remove();
 
  svg.append("text")
    .attr("x", 0)             
    .attr("y", outerRadius + titleOffset)  // Positioning title below the pie chart by the offset
    .attr("text-anchor", "middle")  
    .style("font-size", "16px") 
    .style("font-weight", "bold")  
    .text(titleStr);
}

function pieChartAsPercentages(dataArray){
  let data = dataArray;

  // Compute the total of all values.
  const total = data.reduce((sum, d) => sum + d.value, 0);
 
  // Other unchanged parts...
  // Specify the chart’s dimensions.
  const width = 928;
  const height = Math.min(width, 500);

  // Create the color scale.
  const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse())

  // Create the pie layout and arc generator.
  const pie = d3.pie()
      .sort(null)
      .value(d => d.value);

  const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(Math.min(width, height) / 2 - 1);

  const labelRadius = arc.outerRadius()() * 0.8;

  // A separate arc generator for labels.
  const arcLabel = d3.arc()
      .innerRadius(labelRadius)
      .outerRadius(labelRadius);

  // need to remove entries with <= 0
  let filteredData = dataArray.filter(d => d.value > 0);
  const arcs = pie(filteredData);

  //const arcs = pie(data);

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");


  // Add a sector path for each value.
  svg.append("g")
      .attr("stroke", "white")
    .selectAll()
    .data(arcs)
    .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
    .append("title")
      .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

  // Update labels to display percentage
  svg.append("g")
      .attr("text-anchor", "middle")
    .selectAll()
    .data(arcs)
    .join("text")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .call(text => text.append("tspan")
          .attr("y", "-0.4em")
          .attr("font-weight", "bold")
          .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
          .attr("x", 0)
          .attr("y", "0.7em")
          .attr("fill-opacity", 0.7)
          .text(d => `${((d.data.value / total) * 100).toFixed(2)} %`));  // Convert values to percentage format

  return svg.node();  

}


function pieChart(dataArray)  {
  let data = dataArray; 
  //let data = [{"name":"<5","value":19912018},{"name":"5-9","value":20501982},{"name":"10-14","value":20679786},{"name":"15-19","value":21354481},{"name":"20-24","value":22604232},{"name":"25-29","value":21698010},{"name":"30-34","value":21183639},{"name":"35-39","value":19855782},{"name":"40-44","value":20796128},{"name":"45-49","value":21370368},{"name":"50-54","value":22525490},{"name":"55-59","value":21001947},{"name":"60-64","value":18415681},{"name":"65-69","value":14547446},{"name":"70-74","value":10587721},{"name":"75-79","value":7730129},{"name":"80-84","value":5811429},{"name":"≥85","value":5938752}];
  
  // Specify the chart’s dimensions.
  const width = 928;
  const height = Math.min(width, 500);

  // Create the color scale.
  const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse())

  // Create the pie layout and arc generator.
  const pie = d3.pie()
      .sort(null)
      .value(d => d.value);

  const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(Math.min(width, height) / 2 - 1);

  const labelRadius = arc.outerRadius()() * 0.8;

  // A separate arc generator for labels.
  const arcLabel = d3.arc()
      .innerRadius(labelRadius)
      .outerRadius(labelRadius);

  const arcs = pie(data);

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add a sector path for each value.
  svg.append("g")
      .attr("stroke", "white")
    .selectAll()
    .data(arcs)
    .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
    .append("title")
      .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

  // Create a new arc generator to place a label close to the edge.
  // The label shows the value if there is enough room.
  svg.append("g")
      .attr("text-anchor", "middle")
    .selectAll()
    .data(arcs)
    .join("text")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .call(text => text.append("tspan")
          .attr("y", "-0.4em")
          .attr("font-weight", "bold")
          .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
          .attr("x", 0)
          .attr("y", "0.7em")
          .attr("fill-opacity", 0.7)
          .text(d => d.data.value.toLocaleString("en-US")));

  return svg.node();
}


