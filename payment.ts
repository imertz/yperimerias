import { calculateExodaMulti } from "./calculateExoda";
import { getMultipleInterestRates } from "./getInterestRates";
import {
  mergeAll,
  mergeOfeilesAndExoda,
  transformExoda,
  transformOfeiles,
} from "./mergeObjects";
import { fixNumber, fixNumberString } from "./index";

function singlePayment(
  amount: number,
  paymentDate: string,
  inputs: {
    ofeiles: {
      startDate: string;
      amount: number;
      tokoiYperimerias?: number;
    }[];
    exoda: {
      startDate: string;
      amount: number;
      previousTokoi?: number;
    }[];
    endDate: string;
    exodaTokoforia: boolean;
  }
) {
  const mergedObject = mergeOfeilesAndExoda(
    getMultipleInterestRates(
      inputs.ofeiles.map((r) => ({ ...r })),
      paymentDate
    ),
    calculateExodaMulti(
      inputs.exoda.map((r) => ({ ...r })),
      paymentDate,
      inputs.exodaTokoforia
    )
  );
  const { results, exoda } = mergedObject;
  let remainder = amount;

  let pliromiExodon = 0;
  let pliromiTokonYperOfeilon = 0;
  let pliromiOfeilon = 0;
  let pliromiTokonExodon = 0;

  if (inputs.exodaTokoforia) {
    let exodaRemovedInterest = exoda.map((e: any) => {
      const { exodaSingleCumulative } = e;
      const exodaSingleCumulativeCopy = [...exodaSingleCumulative];
      for (let i = 0; i < exodaSingleCumulativeCopy.length; i++) {
        const item = exodaSingleCumulativeCopy[i];
        if (remainder > 0) {
          let tokoi = fixNumber(parseFloat(item.totalYperInterest));
          if (tokoi > remainder) {
            pliromiTokonExodon += fixNumber(remainder);
            tokoi = fixNumber(tokoi - remainder);
            remainder = 0;
          } else {
            pliromiTokonExodon += fixNumber(tokoi);
            remainder = fixNumber(remainder - tokoi);
            tokoi = 0;
          }
          item.totalYperInterest = fixNumber(tokoi);
        }
      }
      return {
        ...e,
        exodaSingleCumulative: exodaSingleCumulativeCopy,
      };
    });
  }
  let exodaRemovedInterest = exoda;

  let exodaRemovedExoda = exodaRemovedInterest.map((e: any) => {
    const { exodaSingleCumulative } = e;
    const exodaSingleCumulativeCopy = [...exodaSingleCumulative];
    for (let i = 0; i < exodaSingleCumulativeCopy.length; i++) {
      const item = exodaSingleCumulativeCopy[i];
      if (remainder > 0) {
        if (item.exoda > remainder) {
          pliromiExodon += fixNumber(remainder);
          item.exoda = fixNumber(item.exoda - remainder);
          remainder = 0;
        } else {
          pliromiExodon += fixNumber(item.exoda);
          remainder = fixNumber(remainder - item.exoda);
          item.exoda = 0;
        }
      }
    }
    return {
      ...e,
      exodaSingleCumulative: exodaSingleCumulativeCopy,
    };
  });

  let resultsRemovedInterest = results.map((e: any) => {
    const { totals } = e;
    const totalsCopy = [...totals];
    for (let i = 0; i < totalsCopy.length; i++) {
      const item = totalsCopy[i];

      if (remainder > 0) {
        let tokoi = parseFloat(item.totalYperInterest);
        if (tokoi > remainder) {
          pliromiTokonYperOfeilon += remainder;

          tokoi = fixNumber(tokoi - remainder);
          remainder = 0;
        } else {
          pliromiTokonYperOfeilon += tokoi;
          remainder = fixNumber(remainder - tokoi);
          tokoi = 0;
        }
        item.totalYperInterest = tokoi;
      }
    }

    return {
      ...e,
      totals: totalsCopy,
    };
  });

  let resultsRemovedPrincipal = resultsRemovedInterest.map((e: any) => {
    const { totals } = e;
    const totalsCopy = [...totals];
    for (let i = 0; i < totalsCopy.length; i++) {
      const item = totalsCopy[i];

      if (remainder > 0) {
        if (item.principal > remainder) {
          pliromiOfeilon += remainder;
          item.principal = fixNumber(item.principal - remainder);
          remainder = 0;
        } else {
          pliromiOfeilon += item.principal;
          remainder = fixNumber(remainder - item.principal);
          item.principal = 0;
        }
      }
    }
    return {
      ...e,
      totals: totalsCopy,
    };
  });

  return {
    results: resultsRemovedPrincipal,
    exoda: exodaRemovedExoda,
    payments: [
      {
        date: paymentDate,
        amount: fixNumber(amount),
        pliromiTokonExodon: fixNumber(pliromiTokonExodon),
        pliromiExodon: fixNumber(pliromiExodon),
        pliromiTokonYperOfeilon: fixNumber(pliromiTokonYperOfeilon),
        pliromiOfeilon: fixNumber(pliromiOfeilon),
      },
    ],
  };
}

export function multiPayments(
  arr: {
    amount: number;
    paymentDate: string;
  }[],
  inputs: {
    ofeiles: {
      startDate: string;
      amount: number;
      tokoiYperimerias?: number;
    }[];
    exoda: {
      startDate: string;
      amount: number;
      previousTokoi?: number;
    }[];
    endDate: string;
    exodaTokoforia: boolean;
  }
) {
  if (arr.length > 0) {
    let initialPayment = singlePayment(
      arr[0]?.amount as number,
      arr[0]?.paymentDate as string,
      inputs
    );

    for (let i = 1; i <= arr.length; i++) {
      let payment;
      if (i === arr.length) {
        payment = { amount: 0, paymentDate: inputs.endDate };
      }
      if (i < arr.length) {
        payment = arr[i];
      }

      const ofeilesInputs = transformOfeiles(initialPayment as any);

      const exodaInputs = transformExoda(initialPayment as any);

      initialPayment = mergeAll(
        initialPayment,
        singlePayment(
          payment?.amount as number,
          payment?.paymentDate as string,
          { ...inputs, ofeiles: ofeilesInputs, exoda: exodaInputs }
        )
      );

      initialPayment.payments.pop();
    }
    return addMultiTotals(initialPayment);
  } else {
    const results = singlePayment(0, inputs.endDate, inputs);
    results.payments.pop();
    return addMultiTotals(results);
  }
}

function addMultiTotals(obj: any) {
  // if obj does not have totals
  const totalAmount = obj.results.reduce((acc: number, curr: any) => {
    return (
      acc +
      curr.totals.reduce((acc: number, curr: any) => {
        return acc + curr.principal;
      }, 0)
    );
  }, 0);
  const totalTokoi = obj.results.reduce((acc: number, curr: any) => {
    return (
      acc +
      curr.totals.reduce((acc: number, curr: any) => {
        return acc + fixNumberString(curr.totalYperInterest);
      }, 0)
    );
  }, 0);

  if (!obj.multiTotals) {
    obj.multiTotals = {
      startDate: obj.results[0].results[0].startDate,
      lastDateOfCalculation: obj.results[0].totals[0].lastDateOfCalculation,
      totalAmount,
      totalTokoi,
    };
  }
  return obj;
}
