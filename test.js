// import { MockPropertyContext } from "node:test";

const red = "\x1b[38;2;255;68;68m";
const green = "\x1b[38;2;0;230;118m";
const yellow = "\x1b[38;2;255;215;0m";
const reset = "\x1b[0m";

// process.stdout.write(red + "Error: something went wrong" + reset + "\n");
// process.stdout.write(green + "Success: file saved" + reset + "\n");
// process.stdout.write(yellow + "Warning: disk almost full" + reset + "\n");

// const showChart = () => {
//   const randomNumber = Math.trunc(Math.random() * 10);
//   for (let i = 0; i <= 10; i++) {
//     if (i < randomNumber) {
//       process.stdout.write("█");
//     } else {
//       process.stdout.write("░");
//     }
//   }
//   process.stdout.write("\n");
// };

// setInterval(() => {
//   showChart();
// }, 1000);

// const scores = [30, 75, 50, 90, 20];
// const max = Math.max(...scores);
// const HEIGHT = 5;

// for (let row = HEIGHT; row >= 1; row--) {
//   let line = "";
//   for (const score of scores) {
//     const threshold = (row / HEIGHT) * max;
//     line += score >= threshold ? "█  " : "   ";
//   }
//   process.stdout.write(line + "\n");
// }

// process.stdout.write(scores.join("  ") + "\n");

const scores = [12, 23, 10, 22, 12];
const max = 100;
const HEIGHT = 10;

const showChart = () => {
  for (let i = 7; i >= 0; i--) {
    for (let j = 0; j < scores.length; j++) {
      if ((scores[j] * 8) / 24 < i) {
        process.stdout.write("░");
      } else {
        process.stdout.write(green + "█" + reset);
      }
    }
    process.stdout.write("\n");
  }
};

// showChart();

// setInterval(() => {
//   process.stdout.write("\x1b[2J\x1b[H");
//   showChart();
// }, 1000);

setInterval(() => {
  process.stdout.write("\x1b[2J\x1b[H");
  showChart();
}, 1000);
