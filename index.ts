interface Rate {
  startDate: string;
  endDate: string;
  dikaiopraktikos: string;
  yperimerias: string;
}

interface Result {
  startDate: string;
  endDate: string;
  interestRate: string;
  interest: string;
}
function convertDateFormat(dateString: string) {
  const parts = dateString.split("/");
  const year = parts[2];
  const month = parts[1]?.padStart(2, "0");
  const day = parts[0]?.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseTableData(tableString: any) {
  const regex = /<td.*?>(.*?)<\/td>/g;
  const matches = tableString.matchAll(regex);
  const data = [];
  let row: {
    startDate?: string;
    endDate?: string;
    dikaiopraktikos?: string;
    yperimerias?: string;
  } = {};
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

export async function getInterestRates(
  startDate: string,
  endDate: string,
  amount: number
): Promise<(Result | { totalInterest: string; interest: string })[]> {
  const html = await fetch(
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
  );
  const text = await html.text();

  const ratesArray = parseTableData(text.toString());

  const result = ratesArray.reduce<
    (Result | { totalInterest: string; interest: string })[]
  >((result, rate) => {
    const rateStartDate = new Date(rate.startDate as string);
    const rateEndDate = new Date(rate.endDate as string);
    const inputStartDate = new Date(startDate);
    const inputEndDate = new Date(endDate);

    if (rateEndDate < inputStartDate || rateStartDate > inputEndDate) {
      return result;
    }

    const startDateToUse =
      rateStartDate < inputStartDate ? inputStartDate : rateStartDate;
    const endDateToUse =
      rateEndDate > inputEndDate ? inputEndDate : rateEndDate;

    const interestRate =
      rate.dikaiopraktikos &&
      parseFloat(rate.dikaiopraktikos.replace(",", ".")) / 100;
    const days = Math.floor(
      (endDateToUse.getTime() - startDateToUse.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let daysInYear = 365;
    // Check if it's a leap year
    if (
      startDateToUse.getFullYear() % 4 === 0 &&
      (startDateToUse.getFullYear() % 100 !== 0 ||
        startDateToUse.getFullYear() % 400 === 0)
    ) {
      daysInYear = 366;
    }
    const interest =
      (amount * (interestRate ? interestRate : 0) * (days + 1)) / daysInYear;
    console.log(startDateToUse);

    result.push({
      startDate: startDateToUse.toISOString().split("T")[0] as string,
      endDate: endDateToUse.toISOString().split("T")[0] as string,
      interestRate: rate.dikaiopraktikos as string,
      interest: interest.toFixed(2),
    });

    return result;
  }, []);
  const totalInterest = result.reduce((total, rate) => {
    if (typeof rate === "object") {
      return total + parseFloat(rate.interest);
    }
    return total;
  }, 0);
  return [...result, { totalInterest: totalInterest.toFixed(2), interest: "" }];
}
