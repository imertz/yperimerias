import { calculateExodaMulti } from "./calculateExoda";
import { Result, Totals, MultiTotals, Rate } from "./index";
import { mergeOfeilesAndExoda } from "./mergeObjects";
import rates from "./rates.json";

const ratesArray = rates as Rate[];

export function getInterestRates(
  startDate: string,
  endDate: string,
  amount: number,
  tokoiYperimerias: number = 0
): { results: Result[]; totals: Totals[] } {
  // if the start date is after the end date, throw an error
  if (new Date(startDate) > new Date(endDate)) {
    throw new Error(
      "Η αρχική ημερομηνία δεν μπορεί να είναι μετά την ημερομηνία υπολογισμού"
    );
  }
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

    const yperInterest =
      (amount * (yperInterestRate ? yperInterestRate : 0) * (days + 1)) /
      daysInYear;

    result.push({
      startDate: startDateToUse.toISOString().split("T")[0] as string,
      endDate: endDateToUse.toISOString().split("T")[0] as string,

      yperInterestRate: rate.yperimerias as string,
      yperInterest: yperInterest.toFixed(2),
      cumulativeInterest: "",
      days: days + 1,
    });

    return result;
  }, []);

  const totalYperInterest = result.reduce((total, rate, i) => {
    if (typeof rate === "object") {
      result[i] = {
        ...(result[i] as Result),
        cumulativeInterest: (
          total + parseFloat(rate.yperInterest as string)
        ).toFixed(2),
      };
      return total + parseFloat(rate.yperInterest as string);
    }
    return total;
  }, 0);
  const totalDays = result.reduce((total, rate, i) => {
    if (typeof rate === "object") {
      return total + (rate.days as number);
    }
    return total;
  }, 0);
  // change last item of the array to include the total yperimeria interest
  return {
    results: result as Result[],
    totals: [
      {
        principal: amount,
        totalYperInterest: (tokoiYperimerias + totalYperInterest).toFixed(2),
        lastDateOfCalculation: endDate,
        days: totalDays,
      },
    ],
  };
}

export function getMultipleInterestRates(
  arr: {
    startDate: string;
    amount: number;
    tokoiYperimerias?: number;
  }[],
  endDate: string
) {
  const res = arr.map((item) => {
    return getInterestRates(
      item.startDate,
      endDate,
      item.amount,
      item.tokoiYperimerias
    );
  });
  // add an object with the total interest of all the items

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

  const results: {
    results: { results: Result[]; totals: Totals[] }[];
    multiTotals: MultiTotals;
  } = {
    results: res,
    multiTotals: {
      totalYperInterest: totalYperInterest.toFixed(2),
      totalAmounts: totalAmounts.toFixed(2),
    } as MultiTotals,
  };

  return results;
}
