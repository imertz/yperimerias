import rates from "./rates.json";
const ratesArray = rates as Rate[];

console.log('Hey');

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

export async function getInterestRates(
  startDate: string,
  endDate: string,
  amount: number
): Promise<(Result | { totalInterest: string; interest: string })[]> {
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
