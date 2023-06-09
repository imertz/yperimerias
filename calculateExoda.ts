import { ratesArray, Totals, MultiTotals } from "./index";

interface ExodaResult {
  startDate: string;
  endDate: string;
  yperInterest?: string;
  yperInterestRate?: string;
  days?: number;
}

interface exodaTotals extends Totals {
  startDate: string;
  lastDateOfCalculation: string;
}

interface exodaMultiTotals extends MultiTotals {
  startDate: string;
  lastDateOfCalculation: string;
}

export function calculateExoda(
  startDate: string,
  endDate: string,
  amount: number,
  tokoforia: boolean = false,
  previousTokoi: number = 0
): {
  exodaSingleResult: ExodaResult[];
  exodaSingleCumulative: exodaTotals[];
  multiTotals?: exodaMultiTotals;
} {
  if (new Date(startDate) > new Date(endDate)) {
    throw new Error(
      "Η αρχική ημερομηνία δεν μπορεί να είναι μετά την ημερομηνία υπολογισμού"
    );
  }
  if (tokoforia) {
    startDate = startDate.replace(/-/g, "/");
    endDate = endDate.replace(/-/g, "/");
    const result = ratesArray.reduce<(ExodaResult | Totals)[]>(
      (result, rate) => {
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

        const yperInterestRate =
          rate.yperimerias &&
          parseFloat(rate.yperimerias.replace(",", ".")) / 100;

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
      },
      []
    );

    const totalYperInterest = result.reduce((total, rate, i) => {
      if (typeof rate === "object") {
        result[i] = {
          ...(result[i] as ExodaResult),
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
      exodaSingleResult: result as ExodaResult[],
      exodaSingleCumulative: [
        {
          totalYperInterest: (previousTokoi + totalYperInterest).toFixed(2),
          startDate: startDate,
          lastDateOfCalculation: endDate,
          exoda: amount,
          days: totalDays,
        },
      ],
    };
  } else {
    const inputStartDate = new Date(startDate);
    inputStartDate.setHours(inputStartDate.getHours() + 6);
    const inputEndDate = new Date(endDate);
    inputEndDate.setHours(inputEndDate.getHours() + 6);

    // set the time to the end of the day
    inputEndDate.setHours(23, 59, 59, 999);

    const days = Math.floor(
      (inputEndDate.getTime() - inputStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return {
      exodaSingleResult: [
        {
          startDate: startDate,
          endDate: endDate,
          days,
        },
      ],
      exodaSingleCumulative: [
        {
          principal: 0,

          startDate: startDate,
          lastDateOfCalculation: endDate,
          exoda: amount,
          days: days,
        },
      ],
    };
  }
}

export function calculateExodaMulti(
  arr: { startDate: string; amount: number; previousTokoi?: number }[],
  endDate: string,
  tokoforia: boolean = false
) {
  if (arr.length === 0) {
    return {
      exoda: [],
      multiExoda: [],
    };
  }
  let previousExoda = 0;
  let mergedResults: {
    exodaSingleResult: ExodaResult[];
    exodaSingleCumulative: exodaTotals[];
    multiTotals?: exodaMultiTotals;
  }[] = [];
  let multiTotalYperInterest = 0;
  let multiTotalsAmounts = 0;
  for (let index = 0; index < arr.length; index++) {
    const { startDate, amount, previousTokoi } = arr[index] as {
      startDate: string;
      amount: number;
      previousTokoi?: number;
    };

    const result = calculateExoda(
      startDate,
      endDate,
      amount,
      tokoforia,
      previousTokoi
    );
    previousExoda = result?.exodaSingleCumulative[0]?.exoda as number;
    mergedResults.push({
      ...result,
    });

    multiTotalYperInterest += parseFloat(
      result?.exodaSingleCumulative[0]?.totalYperInterest as string
    );
    multiTotalsAmounts += amount;
  }
  interface ExResult {
    exodaSingleResult: ExodaResult[];
    exodaSingleCumulative: exodaTotals[];
    multiTotals: exodaMultiTotals;
  }

  const results: {
    exoda: ExResult[];
    multiExoda: exodaMultiTotals;
  } = {
    exoda: mergedResults as ExResult[],
    multiExoda: {
      totalAmounts: multiTotalsAmounts.toFixed(2),
      startDate: (
        mergedResults[0]?.exodaSingleCumulative[0]?.startDate as string
      ).replace(/-/g, "/"),

      lastDateOfCalculation: (
        mergedResults[mergedResults.length - 1]?.exodaSingleCumulative[0]
          ?.lastDateOfCalculation as string
      ).replace(/-/g, "/"),
    },
  };
  if (tokoforia) {
    results.multiExoda.totalYperInterest = multiTotalYperInterest.toFixed(2);
  }

  return results;
}
