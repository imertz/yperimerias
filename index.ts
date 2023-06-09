import { start } from "repl";
import rates from "./rates.json";
import { parse } from "path";
import { json } from "stream/consumers";
import { calculateExoda } from "./calculateExoda";
import { mergeObjects } from "./mergeObjects";
import { getInterestRates, getMultipleInterestRates } from "./getInterestRates";
import { multiPayments } from "./payment";
export const ratesArray = rates as Rate[];

export { multiPayments };

// utility functions
export const getNextDay = (day: string) => {
  const date = new Date(day);
  // add 6 hours to the date to make sure it's the same day
  date.setHours(date.getHours() + 6);
  // add 1 day to the date
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0] as string;
};

export function fixNumberString(numberString: string) {
  return parseFloat(parseFloat(numberString).toFixed(2));
}

export function fixNumber(num: number) {
  return parseFloat(num.toFixed(2));
}

export interface Rate {
  startDate: string;
  endDate: string;
  dikaiopraktikos: string;
  yperimerias: string;
}

export interface Result {
  startDate: string;
  endDate: string;
  yperInterestRate: string;
  yperInterest?: string;
  totalYperInterest?: string;
  totalAmounts?: string;
  principal?: number;
  days?: number;
  exoda?: number;
}
export interface Totals {
  totalYperInterest?: string;
  yperInterest?: string;
  principal?: number;
  cumulativeInterest?: string;
  lastDateOfCalculation?: string;
  exoda?: number;
  days?: number;
}

export interface MultiTotals {
  totalYperInterest?: string;
  totalAmounts: string;
}

function calculateForPayment(
  arr: {
    startDate: string;
    amount: number;
    tokoiYperimerias?: number;
  }[],
  payment: { date: string; amount: number }
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
// function calculateForPaymentMulti(
//   arr: {
//     startDate: string;
//     amount: number;
//     tokoiYperimerias?: number;
//   }[],
//   payment: { date: string; amount: number }[],
//   endDate: string,
//   exoda?: {
//     arr: { startDate: string; amount: number }[];
//     endDate: string;
//     tokoforia: boolean;
//     previousTokoi: number;
//   }
// ) {
//   let res: ReturnType<typeof calculateForPayment> = [] as any;
//   if (payment.length === 0) {
//     return getMultipleInterestRates(arr.map((r) => ({ ...r, endDate })));
//   }
//   let initialRes = calculateForPayment(arr, payment[0] as any);
//   res = [...initialRes];
//   for (let i = 1; i < payment.length; i++) {
//     res = mergeObjects(
//       res,
//       calculateForPayment(
//         transformResult(res, payment[i]?.date as string),
//         payment[i] as any
//       )
//     );
//   }
//   res = mergeObjects(
//     res,
//     getMultipleInterestRates(transformResult(res, endDate))
//   );
//   return res;
// }

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
