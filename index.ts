import { start } from "repl";
import rates from "./rates.json";
import { parse } from "path";
import { json } from "stream/consumers";
const ratesArray = rates as Rate[];

// utility functions
const getNextDay = (day: string) => {
  const date = new Date(day);
  // add 6 hours to the date to make sure it's the same day
  date.setHours(date.getHours() + 6);
  // add 1 day to the date
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0] as string;
};

function fixNumberString(numberString: string) {
  return parseFloat(parseFloat(numberString).toFixed(2));
}

function fixNumber(num: number) {
  return parseFloat(num.toFixed(2));
}

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
  yperInterestRate: string;
  yperInterest: string;
  totalInterest?: string;
  totalYperInterest?: string;
  totalAmounts?: string;
  principal?: number;
  days?: number;
  exoda?: string;
}
interface Totals {
  totalInterest: string;
  interest: string;
  totalYperInterest: string;
  yperInterest: string;
  principal?: number;
  cumulativeInterest?: string;
  lastDateOfCalculation?: string;
}

interface MultiTotals {
  totalInterest: string;
  totalYperInterest: string;
  totalAmounts: string;
}
export function getInterestRates(
  startDate: string,
  endDate: string,
  amount: number,
  tokoiYperimerias: number = 0
): { results: Result[]; totals: Totals[]; multiTotals?: MultiTotals } {
  startDate = startDate.replace(/-/g, "/");
  endDate = endDate.replace(/-/g, "/");
  const result = ratesArray.reduce<(Result | Totals)[]>((result, rate) => {
    // add 6 hours to the date to make sure it's the same day
    const rateStartDate = new Date(rate.startDate as string);
    rateStartDate.setHours(rateStartDate.getHours() + 6);
    const rateEndDate = new Date(rate.endDate as string);
    rateEndDate.setHours(rateEndDate.getHours() + 6);
    const inputStartDate = new Date(startDate);
    inputStartDate.setHours(inputStartDate.getHours() + 6);
    const inputEndDate = new Date(endDate);
    inputEndDate.setHours(inputEndDate.getHours() + 6);

    if (rateEndDate < inputStartDate || rateStartDate > inputEndDate) {
      return result;
    }

    const startDateToUse =
      rateStartDate < inputStartDate ? inputStartDate : rateStartDate;
    const endDateToUse =
      rateEndDate > inputEndDate ? inputEndDate : rateEndDate;
    // set the time to the end of the day
    endDateToUse.setHours(23, 59, 59, 999);

    const interestRate =
      rate.dikaiopraktikos &&
      parseFloat(rate.dikaiopraktikos.replace(",", ".")) / 100;
    const yperInterestRate =
      rate.yperimerias && parseFloat(rate.yperimerias.replace(",", ".")) / 100;

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
    const yperInterest =
      (amount * (yperInterestRate ? yperInterestRate : 0) * (days + 1)) /
      daysInYear;

    result.push({
      startDate: startDateToUse.toISOString().split("T")[0] as string,
      endDate: endDateToUse.toISOString().split("T")[0] as string,
      interestRate: rate.dikaiopraktikos as string,
      interest: interest.toFixed(2),
      yperInterestRate: rate.yperimerias as string,
      yperInterest: yperInterest.toFixed(2),
      cumulativeInterest: "",
      days: days + 1,
      exoda: "",
    });

    return result;
  }, []);
  const totalInterest = result.reduce((total, rate) => {
    if (typeof rate === "object") {
      return total + parseFloat(rate.interest);
    }
    return total;
  }, 0);
  const totalYperInterest = result.reduce((total, rate, i) => {
    if (typeof rate === "object") {
      result[i] = {
        ...(result[i] as Result),
        cumulativeInterest: (total + parseFloat(rate.yperInterest)).toFixed(2),
      };
      return total + parseFloat(rate.yperInterest);
    }
    return total;
  }, 0);
  // change last item of the array to include the total yperimeria interest

  return {
    results: result as Result[],
    totals: [
      {
        principal: amount,
        totalInterest: totalInterest.toFixed(2),
        interest: "",
        totalYperInterest: (tokoiYperimerias + totalYperInterest).toFixed(2),
        yperInterest: "",
        lastDateOfCalculation: endDate,
      },
    ],
  };
}

export function getMultipleInterestRates(
  arr: { startDate: string; endDate: string; amount: number }[]
) {
  const res = arr.map((item) =>
    getInterestRates(item.startDate, item.endDate, item.amount)
  );
  // add an object with the total interest of all the items
  const totalInterest = res.reduce((total, item) => {
    return (
      total +
      parseFloat(item.totals[item.totals.length - 1]?.totalInterest as string)
    );
  }, 0);
  const totalYperInterest = res.reduce((total, item) => {
    return (
      total +
      parseFloat(
        item.totals[item.totals.length - 1]?.totalYperInterest as string
      )
    );
  }, 0);
  // add the total amounts to the last item of the array

  const totalAmounts = arr.reduce((total, item) => {
    return total + item.amount;
  }, 0);

  res.push({
    results: [] as Result[],
    totals: [] as Totals[],
    multiTotals: {
      totalInterest: totalInterest.toFixed(2),
      totalYperInterest: totalYperInterest.toFixed(2),
      totalAmounts: totalAmounts.toFixed(2),
    } as MultiTotals,
  });
  return res;
}

function calculateForPayment(
  arr: {
    startDate: string;
    amount: number;
    tokoiYperimerias?: number;
  }[],
  payment: { date: string; amount: number },
  exoda: { date: string; amount: number }[]
) {
  const res = arr
    .sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    })
    .map((item) =>
      getInterestRates(
        item.startDate,
        payment.date,
        item.amount,
        item.tokoiYperimerias
      )
    );
  let remainder = 0;
  const totalInterest = res.reduce((total, item) => {
    return (
      total +
      parseFloat(item.totals[item.totals.length - 1]?.totalInterest as string)
    );
  }, 0);
  let totalYperInterest =
    res.reduce((total, item) => {
      return (
        total +
        parseFloat(
          item.totals[item.totals.length - 1]?.totalYperInterest as string
        )
      );
    }, 0) - payment.amount;
  if (totalYperInterest < 0) {
    remainder = totalYperInterest;
    totalYperInterest = 0;
  }

  const totalAmounts =
    arr.reduce((total, item) => {
      return total + item.amount;
    }, 0) + remainder;

  let tokoiPayment = (payment.amount + remainder) * -1;

  const newArr = res.map((item, i) => {
    if (i !== res.length - 1) {
    }

    let principal = 0;
    if (parseFloat(((arr[i]?.amount as number) + remainder).toFixed(2)) < 0) {
      remainder = parseFloat(
        ((arr[i]?.amount as number) + remainder).toFixed(2) + remainder
      );
    } else {
      principal = parseFloat(
        ((arr[i]?.amount as number) + remainder).toFixed(2)
      );
      remainder = 0;
    }

    let totalYperInterest = "0.00";

    if (
      parseFloat(
        (
          parseFloat(
            item.totals[item.totals.length - 1]?.totalYperInterest as string
          ) + tokoiPayment
        ).toFixed(2)
      ) < 0
    ) {
      tokoiPayment = parseFloat(
        (
          parseFloat(
            item.totals[item.totals.length - 1]?.totalYperInterest as string
          ) + tokoiPayment
        ).toFixed(2)
      );
    } else {
      totalYperInterest = (
        parseFloat(
          item.totals[item.totals.length - 1]?.totalYperInterest as string
        ) + tokoiPayment
      ).toFixed(2);
      tokoiPayment = 0;
    }

    item.totals.push({
      ...item.totals[item.totals.length - 1],
      principal,
      totalYperInterest,
    } as Totals);
    return item;
  });

  return [
    ...newArr,
    {
      multiTotals: {
        totalInterest: totalInterest.toFixed(2),
        interest: "",
        totalYperInterest: totalYperInterest.toFixed(2),
        yperInterest: "",
        totalAmounts: totalAmounts.toFixed(2),
      },
      results: [] as Result[],
      totals: [] as Totals[],
    },
  ];
}
function calculateForPaymentMulti(
  arr: {
    startDate: string;
    amount: number;
    tokoiYperimerias?: number;
  }[],
  payment: { date: string; amount: number }[],
  endDate: string,
  exoda: { date: string; amount: number }[]
) {
  let res: ReturnType<typeof calculateForPayment> = [] as any;
  if (payment.length === 0) {
    return getMultipleInterestRates(arr.map((r) => ({ ...r, endDate })));
  }
  let initialRes = calculateForPayment(arr, payment[0] as any);
  res = [...initialRes];
  for (let i = 1; i < payment.length; i++) {
    res = mergeObjects(
      res,
      calculateForPayment(
        transformResult(res, payment[i]?.date as string),
        payment[i] as any
      )
    );
  }
  res = mergeObjects(
    res,
    getMultipleInterestRates(transformResult(res, endDate))
  );
  return res;
}

// console.log(
//   JSON.stringify(
//     transformResult(
//       calculateForPayment(
//         [
//           {
//             startDate: "2023-01-01",
//             amount: 1000,
//           },
//           {
//             startDate: "2023-02-01",
//             amount: 1000,
//           },
//         ],

//         {
//           date: "2023-04-01",
//           amount: 200,
//         }
//       ),
//       "2023-06-03"
//     ),
//     null,
//     2
//   )
// );

function transformResult(
  arr: ReturnType<typeof calculateForPayment>,
  endDate: string
) {
  return arr
    .filter((r) => !Object.keys(r).includes("multiTotals"))
    .map((item) => {
      const totals = item.totals as unknown as Totals[];
      return {
        startDate: getNextDay(
          item.results[item.results.length - 1]?.endDate as string
        ),
        endDate: endDate,
        amount: totals[totals.length - 1]?.principal as number,
        tokoiYperimerias: totals[totals.length - 1]?.totalYperInterest
          ? parseFloat(totals[totals.length - 1]?.totalYperInterest as string)
          : 0,
      };
    });
}

// console.log(
//   JSON.stringify(
//     getMultipleInterestRates(
//       transformResult(
//         getMultipleInterestRates([
//           {
//             startDate: "2023-01-01",
//             endDate: "2023-04-01",
//             amount: 1000,
//           },
//           {
//             startDate: "2023-02-01",
//             endDate: "2023-03-01",
//             amount: 1000,
//           },
//         ]),
//         "2023-05-03"
//       )
//     ),
//     null,
//     2
//   )
// );

// console.log(
//   JSON.stringify(
//     getMultipleInterestRates([
//       {
//         startDate: "2023-01-01",
//         endDate: "2023-04-01",
//         amount: 1000,
//       },
//       {
//         startDate: "2023-02-01",
//         endDate: "2023-03-01",
//         amount: 1000,
//       },
//     ]),
//     null,
//     2
//   )
// );

// console.log(
//   JSON.stringify(
//     mergeObjects(
//       getMultipleInterestRates([
//         {
//           startDate: "2023-01-01",
//           endDate: "2023-04-01",
//           amount: 1000,
//         },
//         {
//           startDate: "2023-02-01",
//           endDate: "2023-03-01",
//           amount: 1000,
//         },
//       ]),
//       getMultipleInterestRates([
//         {
//           startDate: "2023-04-02",
//           endDate: "2023-05-01",
//           amount: 1000,
//         },
//         {
//           startDate: "2023-03-02",
//           endDate: "2023-04-01",
//           amount: 1000,
//         },
//       ])
//     ),
//     null,
//     2
//   )
// );

function mergeObjects(obj1: any[], obj2: any[]): any[] {
  const mergedResults = obj1.map((item, index) => {
    if (!Object.keys(item).includes("multiTotals")) {
      return {
        results: item.results.concat(obj2[index].results),
        totals: item.totals.concat(obj2[index].totals),
      };
    } else {
      return {
        multiTotals: {
          totalInterest:
            parseFloat(item?.multiTotals.totalInterest) +
            parseFloat(obj2[index]?.multiTotals.totalInterest),
          totalYperInterest:
            parseFloat(item?.multiTotals.totalYperInterest) +
            parseFloat(obj2[index]?.multiTotals.totalYperInterest),
          totalAmounts:
            parseFloat(item?.multiTotals.totalAmounts) +
            parseFloat(obj2[index]?.multiTotals.totalAmounts),
        },
        results: [],
        totals: [],
      };
    }
  });
  let multiTotalsInterest = 0;
  for (let index = 0; index < mergedResults.length; index++) {
    if (mergedResults[index]?.totals.length > 0) {
      multiTotalsInterest += fixNumberString(
        mergedResults[index]?.totals[mergedResults[index]?.totals.length - 1]
          .totalInterest
      );
    }
  }
  let multiTotalsYperInterest = 0;
  for (let index = 0; index < mergedResults.length; index++) {
    if (mergedResults[index]?.totals.length > 0) {
      multiTotalsYperInterest += fixNumberString(
        mergedResults[index]?.totals[mergedResults[index]?.totals.length - 1]
          .totalYperInterest
      );
    }
  }
  let multiTotalsAmounts = 0;
  for (let index = 0; index < mergedResults.length; index++) {
    if (mergedResults[index]?.totals.length > 0) {
      multiTotalsAmounts += fixNumberString(
        mergedResults[index]?.totals[mergedResults[index]?.totals.length - 1]
          .principal
      );
    }
  }
  mergedResults.pop();
  mergedResults.push({
    multiTotals: {
      totalInterest: fixNumber(multiTotalsInterest),
      totalYperInterest: fixNumber(multiTotalsYperInterest),
      totalAmounts: fixNumber(multiTotalsAmounts),
    },
    results: [],
    totals: [],
  });
  console.log("mergedResults", mergedResults);

  return mergedResults;
}

console.log(
  JSON.stringify(
    calculateForPaymentMulti(
      [
        {
          startDate: "2023-01-04",
          amount: 1000,
        },
        {
          startDate: "2023-02-01",
          amount: 1000,
        },
      ],
      [],
      "2023-06-03"
    ),
    null,
    2
  )
);
