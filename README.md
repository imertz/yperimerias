# Interest Rate Calculator

This is an open-source npm package that calculates the default rate of interest. The latest rates are fetched from [www.bankofgreece.gr](https://www.bankofgreece.gr).

You can test it here [yperimeria.netlify.app](https://yperimeria.netlify.app).

## Installation

To install this package, run the following command:

## Usage

To use this package, import the `getInterestRates` function and call it with the appropriate parameters:

```javascript
import { getInterestRates } from "interest-rate-calculator";

const startDate = "2022-01-01";
const endDate = "2022-01-31";
const amount = 1000;

const result = getInterestRates(startDate, endDate, amount);

console.log(result);
```
