import { start } from "repl";
import rates from "./rates.json";
const ratesArray = rates as Rate[];

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
}

export function getInterestRates(
  startDate: string,
  endDate: string,
  amount: number
): (
  | Result
  | {
      totalInterest: string;
      interest: string;
      totalYperInterest: string;
      yperInterest: string;
    }
)[] {
  startDate = startDate.replace(/-/g, "/");
  endDate = endDate.replace(/-/g, "/");
  const result = ratesArray.reduce<
    (
      | Result
      | {
          totalInterest: string;
          interest: string;
          totalYperInterest: string;
          yperInterest: string;
        }
    )[]
  >((result, rate) => {
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
    });

    return result;
  }, []);
  const totalInterest = result.reduce((total, rate) => {
    if (typeof rate === "object") {
      return total + parseFloat(rate.interest);
    }
    return total;
  }, 0);
  const totalYperInterest = result.reduce((total, rate) => {
    if (typeof rate === "object") {
      return total + parseFloat(rate.yperInterest);
    }
    return total;
  }, 0);
  return [
    ...result,
    {
      totalInterest: totalInterest.toFixed(2),
      interest: "",
      totalYperInterest: totalYperInterest.toFixed(2),
      yperInterest: "",
    },
  ];
}
