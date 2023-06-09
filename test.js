const day = "2023-01-01";

// function to get next day
const getNextDay = (day) => {
  const date = new Date(day);
  // add 6 hours to the date to make sure it's the same day
  date.setHours(date.getHours() + 6);
  // add 1 day to the date
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};
console.log(getNextDay(day)); // 2023-01-02
