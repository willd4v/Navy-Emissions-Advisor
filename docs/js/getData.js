async function getData() {
  var headerNames;
  var shipDict = {};

  const response = await fetch("F76_fuel_consumption_values.csv");
  const data = await response.text();
  const csvData = data.split("\r\n");

  //takes the information from csv file and turns into
  csvData.forEach((row, index) => {
    const columns = row.split(",");
    if (index === 0) {
      headerNames = columns;
    } else {
      const shipData = {};
      for (let i = 1; i < headerNames.length; i++) {
        shipData[headerNames[i]] = parseFloat(columns[i]);
      }
      const shipKey = columns[0];
      shipDict[shipKey] = shipData;

      //checks
      //console.log(shipDict[shipKey]);
      // if (typeof shipData.x_underway === "number") {
      //   console.log("its a number");}
    }
  });
  //console.log(shipDict);
  return shipDict;
}
