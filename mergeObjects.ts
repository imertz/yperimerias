import { calculateExodaMulti } from "./calculateExoda";
import { getMultipleInterestRates } from "./getInterestRates";
import { Totals, getNextDay } from "./index";

import { fixNumberString, fixNumber } from "./index";

export function mergeObjects(obj1: any[], obj2: any[]): any[] {
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

  return mergedResults;
}

export function mergeOfeilesAndExoda(obj1: any, obj2: any): any {
  return { ...obj1, ...obj2 };
}

export function transformOfeiles(
  resultsProvided: ReturnType<typeof getMultipleInterestRates>
) {
  return resultsProvided.results.map((item) => {
    const totals = item.totals as Totals[];
    return {
      startDate: getNextDay(
        item.results[item.results.length - 1]?.endDate as string
      ) as string,
      amount: totals[totals.length - 1]?.principal as number,
      tokoiYperimerias: totals[totals.length - 1]?.totalYperInterest
        ? parseFloat(totals[totals.length - 1]?.totalYperInterest as string)
        : 0,
    };
  });
}

export function transformExoda(
  exodaProvided: ReturnType<typeof calculateExodaMulti>
) {
  return exodaProvided.exoda.map((item) => {
    let previousTokoi = parseFloat(
      item.exodaSingleCumulative[item.exodaSingleCumulative.length - 1]
        ?.totalYperInterest as string
    );
    return {
      startDate: getNextDay(
        item.exodaSingleResult[item.exodaSingleResult.length - 1]
          ?.endDate as string
      ) as string,
      amount: item.exodaSingleCumulative[item.exodaSingleCumulative.length - 1]
        ?.exoda as number,
      previousTokoi: previousTokoi ? previousTokoi : 0,
    };
  });
}

function mergeOfeiles(obj1: any, obj2: any): any {
  const mergedResults = obj1.results.map((item: any, index: number) => {
    let newCumulativeInterest =
      item.totals[item.totals.length - 1].totalYperInterest;

    let obj2ChangedCumulative = obj2.results[index].results.map((i: any) => {
      newCumulativeInterest = (
        fixNumberString(newCumulativeInterest) + fixNumberString(i.yperInterest)
      ).toFixed(2);
      return {
        ...i,
        cumulativeInterest: newCumulativeInterest,
      };
    });
    let totals = obj2.results[index].totals;
    totals[0].days = item.totals[0].days + obj2.results[index].totals[0].days;

    return {
      results: item.results.concat(obj2ChangedCumulative),
      totals,
    };
  });

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
  const mergedMultiTotals = {
    totalYperInterest: fixNumber(multiTotalsYperInterest),
    totalAmounts: fixNumber(multiTotalsAmounts),
  };

  return {
    results: mergedResults,
    multiTotals: mergedMultiTotals,
  };
}

function mergeExoda(obj1: any, obj2: any): any {
  const mergedExoda = obj1.exoda.map((item: any, index: number) => {
    let obj2ChangedCumulative = obj2.exoda[index].exodaSingleResult.map(
      (i: any) => {
        if (
          (
            fixNumberString(i.cumulativeInterest) +
            fixNumberString(
              obj1.exoda[index].exodaSingleCumulative[0].totalYperInterest
            )
          ).toFixed(2) !== "NaN"
        )
          return {
            ...i,
            cumulativeInterest: (
              fixNumberString(i.cumulativeInterest) +
              fixNumberString(
                obj1.exoda[index].exodaSingleCumulative[0].totalYperInterest
              )
            ).toFixed(2),
          };
        else return i;
      }
    );
    let totals = obj2.exoda[index].exodaSingleCumulative;
    totals[0].days =
      item.exodaSingleCumulative[0].days +
      obj2.exoda[index].exodaSingleCumulative[0].days;

    return {
      exodaSingleResult: item.exodaSingleResult.concat(obj2ChangedCumulative),
      exodaSingleCumulative: totals,
    };
  });
  let totalYperInterest = 0;
  for (let index = 0; index < mergedExoda.length; index++) {
    if (mergedExoda[index]?.exodaSingleCumulative.length > 0) {
      totalYperInterest += fixNumberString(
        mergedExoda[index]?.exodaSingleCumulative[
          mergedExoda[index]?.exodaSingleCumulative.length - 1
        ].totalYperInterest
      );
    }
  }
  let totalAmounts = 0;
  for (let index = 0; index < mergedExoda.length; index++) {
    if (mergedExoda[index]?.exodaSingleCumulative.length > 0) {
      totalAmounts += fixNumberString(
        mergedExoda[index]?.exodaSingleCumulative[
          mergedExoda[index]?.exodaSingleCumulative.length - 1
        ].exoda
      );
    }
  }
  let mergedMultiTotals;
  if (totalYperInterest) {
    mergedMultiTotals = {
      totalYperInterest: fixNumber(totalYperInterest),

      totalAmounts: fixNumber(totalAmounts),
    };
  } else {
    mergedMultiTotals = {
      totalAmounts: fixNumber(totalAmounts),
    };
  }

  return {
    exoda: mergedExoda,
    multiExoda: mergedMultiTotals,
  };
}
function mergePayments(obj1: any, obj2: any): any {
  return [...obj1.payments, ...obj2.payments];
}

export function mergeAll(obj1: any, obj2: any): any {
  const mergedExoda = mergeExoda(obj1, obj2);

  const mergedOfeiles = mergeOfeiles(obj1, obj2);
  const mergedOfeilesAndExoda = mergeOfeilesAndExoda(
    mergedOfeiles,
    mergedExoda
  );
  const mergedPayments = mergePayments(obj1, obj2);

  return { ...mergedOfeilesAndExoda, payments: mergedPayments };
}
