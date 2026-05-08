import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

const PAGE_SIZE = 16384;

export const getVMStat = async () => {
  try {
    const { stderr, stdout } = await execPromise("vm_stat");
    if (stderr) {
      console.error("vm_stat warning", stderr);
    }
    const data = stdout.split("\n").slice(1, -1);
    const arr = data.map((el) => {
      return el.replace(/\s+/g, "").split(":");
    });
    const arr2 = arr.reduce((acc, el) => {
      acc[el[0]] = Number(el[1].replace(".", ""));
      return acc;
    }, {});

    const totalRamConsumed =
      ((arr2.Pagesactive +
        arr2.Pageswireddown +
        arr2.Pagesoccupiedbycompressor) *
        PAGE_SIZE) /
      1024 ** 3;

    return parseFloat(totalRamConsumed.toFixed(2));
  } catch (err) {
    console.error(err.message);
    return null;
  }
};

const red = "\x1b[38;2;255;75;75m";
const green = "\x1b[38;2;0;245;175m";
const yellow = "\x1b[38;2;255;175;0m";
const dimGrey = "\x1b[38;2;45;48;65m";
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const white = "\x1b[38;2;210;215;230m";
const muted = "\x1b[38;2;85;90;110m";

const history = [];

const renderColor = (value) => {
  if (value < 12) {
    return green;
  } else if (value < 16) {
    return yellow;
  } else {
    return red;
  }
};

export const renderGraph = (totalRamConsumed) => {
  history.push(totalRamConsumed);
  if (history.length > 50) {
    history.shift();
  }

  const current = history[history.length - 1];
  const currentColor = renderColor(current);
  const lines = [];

  lines.push(`  ${bold}${white}RAM USAGE${reset}  ${muted}macOS · ${history.length} samples · 24 GB total${reset}`);
  lines.push("");

  for (let i = 7; i >= 0; i--) {
    const label = String((i + 1) * 3).padStart(2);
    let row = `  ${muted}${label} ┤${reset}`;
    for (let j = 0; j < history.length; j++) {
      if ((history[j] * 8) / 24 < i) {
        row += `${dimGrey}░${reset}`;
      } else {
        row += renderColor(history[j]) + "█" + reset;
      }
    }
    lines.push(row);
  }

  lines.push(`  ${muted} 0 └${"─".repeat(history.length)}${reset}`);
  lines.push("");

  const pct = Math.round((current / 24) * 100);
  const filled = Math.round((current / 24) * 16);
  const bar = `${currentColor}${"█".repeat(filled)}${reset}${muted}${"░".repeat(16 - filled)}${reset}`;
  lines.push(`  ${muted}●${reset}  ${currentColor}${bold}${current} GB${reset}  ${muted}/ 24 GB${reset}  ${bar}  ${currentColor}${bold}${pct}%${reset}`);

  return lines;
};

// setInterval(async () => {
//   const totalRamConsumed = await getVMStat();
//   process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
//   // process.stdout.write(
//   //   `Ram usage: ${history[history.length - 1]} GB / 24 GB\n`,
//   // );
//   renderGraph(totalRamConsumed);
// }, 1000);
