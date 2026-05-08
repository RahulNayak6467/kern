import { exec } from "node:child_process";
import { get } from "node:https";
import { promisify } from "node:util";
const execAsync = promisify(exec);

const red = "\x1b[38;2;255;75;75m";
const green = "\x1b[38;2;0;245;175m";
const yellow = "\x1b[38;2;255;175;0m";
const dimGrey = "\x1b[38;2;45;48;65m";
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const white = "\x1b[38;2;210;215;230m";
const muted = "\x1b[38;2;85;90;110m";
const orange = "\x1b[38;2;255;140;0m";

export const getDiskInfo = async () => {
  try {
    const { stdout, stderr } = await execAsync("iostat -d -w 1 -c 2");
    if (stderr) {
      console.error(`Error in getDiskInfo: ${stderr}`);
    }
    console.log(stdout);
    // console.log(stdout.split("\n")[3].replace(/\s+/g, " ").trim().split(" "));
    const diskInfo = stdout
      .split("\n")[3]
      .replace(/\s+/g, " ")
      .trim()
      .split(" ");
    const requiredDiskInfo = diskInfo[2];
    let parsedDiskInfo;
    if (
      isNaN(parseFloat(requiredDiskInfo)) ||
      parseFloat(requiredDiskInfo) === undefined
    ) {
      parsedDiskInfo = 0;
    } else {
      parsedDiskInfo = parseFloat(requiredDiskInfo);
    }
    return parsedDiskInfo;
  } catch (error) {
    console.error(`Error in getDiskInfo: ${error.message}`);
  }
};

// getDiskInfo();

let history = [];
const MAX_HISTORY = 50;

const getData = (data) => {
  if (data < 10) {
    return 10;
  } else if (data < 20) {
    return 20;
  } else if (data < 50) {
    return 30;
  } else if (data < 100) {
    return 50;
  } else {
    return 100;
  }
};

const getColor = (data) => {
  if (data < 10) {
    return green;
  } else if (data < 50) {
    return yellow;
  } else if (data < 100) {
    return orange;
  } else {
    return red;
  }
};

export const renderDiskGraph = (diskInfo) => {
  // const diskInfo = await getDiskInfo();
  history.push(diskInfo);
  if (history.length > 50) {
    history.shift();
  }

  const lines = [];
  lines.push(
    `  ${bold}${white}DISK I/O${reset}  ${muted}macOS · ${history.length} samples · MB/s write${reset}`,
  );
  lines.push("");

  for (let i = 10; i >= 1; i--) {
    const label = i % 2 === 0 ? String(i * 10).padStart(3) : "   ";
    let row = `  ${muted}${label} ┤${reset}`;
    for (let j = 0; j < MAX_HISTORY; j++) {
      if (getData(history[j]) < i * 10) {
        row += dimGrey + "░" + reset;
      } else {
        row += getColor(getData(history[j])) + "█" + reset;
      }
    }
    lines.push(row);
  }

  lines.push(`  ${muted}  0 └${"─".repeat(MAX_HISTORY)}${reset}`);
  lines.push("");

  const current = history[history.length - 1];
  const currentColor = getColor(current);
  const pct = Math.min(Math.round(current), 100);
  const filled = Math.round((pct / 100) * 16);
  const bar = `${currentColor}${"█".repeat(filled)}${reset}${muted}${"░".repeat(16 - filled)}${reset}`;
  lines.push(
    `  ${muted}●${reset}  ${currentColor}${bold}${current} MB/s${reset}  ${muted}/ 100 MB/s${reset}  ${bar}  ${currentColor}${bold}${pct}%${reset}`,
  );

  return lines;
};
