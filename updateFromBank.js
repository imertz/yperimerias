const fs = require("fs");

fetch(
  "https://www.bankofgreece.gr/statistika/xrhmatopistwtikes-agores/ekswtrapezika-epitokia",
  {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-GB,en;q=0.9,en-US;q=0.8,el;q=0.7,fr;q=0.6",
      "cache-control": "max-age=0",
      "if-modified-since": "Wed, 31 May 2023 17:58:53 GMT",
      "sec-ch-ua":
        '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "cross-site",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    referrer: "https://www.google.com/",
    referrerPolicy: "origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  }
).then((response) => {
  response.text().then((text) => {
    const ratesArray = parseTableData(text.toString());
    // write to file
    fs.writeFile("./rates.json", JSON.stringify(ratesArray), function (err) {
      if (err) throw err;
      console.log("Saved!");
    });
  });
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
