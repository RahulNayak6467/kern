import { exec } from "child_process";
import { get } from "https";
import { promisify } from "util";

const execAsync = promisify(exec);

const red = "\x1b[38;2;255;75;75m";
const green = "\x1b[38;2;0;245;175m";
const yellow = "\x1b[38;2;255;175;0m";
const cyan = "\x1b[38;2;0;229;255m";
const dimGrey = "\x1b[38;2;45;48;65m";
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const white = "\x1b[38;2;210;215;230m";
const muted = "\x1b[38;2;85;90;110m";
const purple = "\x1b[38;2;199;125;255m";

const getNetworkData = async () => {
  try {
    const { stdout, stderr } = await execAsync("netstat -ib");
    if (stderr) throw stderr;
    const data = stdout
      .split("\n")
      .find((line) => line.includes("en0") && line.includes("<Link#"))
      .replace(/\s+/g, " ")
      .split(" ");

    const inputBytes = Number(data[6]);
    const outputBytes = Number(data[9]);
    // console.log(data[6], data[9]);

    return { inputBytes, outputBytes };
  } catch (error) {
    console.error(error.message);
    return null;
  }
};

const MAX_HEIGHT = 4;
const MAX_HISTORY = 50;

const getColor = (value) => {
  if (value < 3) return green;
  if (value <= 8) return yellow;
  return red;
};

export const renderNetworkGraph = (data, label, historyArr) => {
  if (historyArr.length > MAX_HISTORY) historyArr.shift();
  historyArr.push(data);

  const color = getColor(data);
  const lines = [];

  lines.push(
    `  ${bold}${white}${label}${reset}  ${muted}en0 · ${historyArr.length} samples · KB/s${reset}`,
  );
  lines.push("");

  for (let i = MAX_HEIGHT; i >= 1; i--) {
    const labelStr = i % 2 === 0 ? String(i * 2).padStart(3) : "   ";
    let row = `  ${muted}${labelStr} ┤${reset}`;
    for (let j = 0; j < historyArr.length; j++) {
      if ((historyArr[j] * MAX_HEIGHT) / 10 + 1 > i) {
        row += getColor(historyArr[j]) + "█" + reset;
      } else {
        row += dimGrey + "░" + reset;
      }
    }
    lines.push(row);
  }

  lines.push(`  ${muted}  0 └${"─".repeat(MAX_HISTORY)}${reset}`);
  lines.push("");

  const pct = Math.min(Math.round((data / 10) * 100), 100);
  const filled = Math.round((pct / 100) * 16);
  const bar = `${color}${"█".repeat(filled)}${reset}${muted}${"░".repeat(16 - filled)}${reset}`;
  lines.push(
    `  ${muted}●${reset}  ${color}${bold}${data} KB/s${reset}  ${muted}/ 10 KB/s${reset}  ${bar}  ${color}${bold}${pct}%${reset}`,
  );

  return lines;
};

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const visLen = (s) => stripAnsi(s).length;

export const renderSideBySide = (leftLines, rightLines, gap = 4) => {
  const leftWidth = Math.max(...leftLines.map((l) => visLen(l)));
  const height = Math.max(leftLines.length, rightLines.length);
  let out = "";
  for (let i = 0; i < height; i++) {
    const l = leftLines[i] ?? "";
    const r = rightLines[i] ?? "";
    const pad = leftWidth - visLen(l);
    out += l + " ".repeat(pad + gap) + r + "\n";
  }
  process.stdout.write(out);
};

let prevSnapshot = null;
export const getData = async () => {
  const current = await getNetworkData();

  if (!prevSnapshot) {
    prevSnapshot = current;
    return { parsedInputBytes: 0, parsedOutputBytes: 0 };
  }

  const inputKB = (current.inputBytes - prevSnapshot.inputBytes) / 1024;
  const outputKB = (current.outputBytes - prevSnapshot.outputBytes) / 1024;

  prevSnapshot = current;

  return {
    parsedInputBytes: parseFloat(inputKB.toFixed(2)),
    parsedOutputBytes: parseFloat(outputKB.toFixed(2)),
  };
};

const downHistory = [];
const upHistory = [];
