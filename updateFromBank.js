const fs = require("fs");
const bog = fs.readFileSync("./bankofgreece.txt", "utf8");
const ratesArray = parseTableData(bog);
// write to file
fs.writeFile("./rates.json", JSON.stringify(ratesArray), function (err) {
  if (err) throw err;
  console.log("Saved!");
});

function convertDateFormat(dateString) {
  const parts = dateString.split("/");
  const year = parts[2];
  const month = parts[1]?.padStart(2, "0");
  const day = parts[0]?.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseTableData(tableString) {
  const regex = /<td.*?>(.*?)<\/td>/g;
  const matches = tableString.matchAll(regex);
  const data = [];
  let row = {};
  let i = 0;
  for (const match of matches) {
    const value = match[1].trim();
    switch (i % 6) {
      case 0:
        row.startDate = convertDateFormat(value);
        break;
      case 1:
        row.endDate = convertDateFormat(value);
        break;
      case 4:
        row.dikaiopraktikos = value;

        break;
      case 5:
        row.yperimerias = value;
        data.push(row);
        row = {};
        break;
    }
    i++;
  }
  return data;
}
