import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

const green = "\x1b[38;2;0;245;175m";
const yellow = "\x1b[38;2;255;175;0m";
const red = "\x1b[38;2;255;75;75m";
const dimGrey = "\x1b[38;2;45;48;65m";
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const white = "\x1b[38;2;210;215;230m";
const muted = "\x1b[38;2;85;90;110m";

export const getBatteryData = async () => {
  try {
    const { stdout, stderr } = await execPromise("pmset -g batt");
    if (stderr) throw new Error(stderr);
    const batteryInfo = stdout
      .trim()
      .split("\n")[1]
      .replace(/\s+/g, " ")
      .trim()
      .replace(";", "")
      .split(" ");

    // console.log(stdout);
    // console.log(batteryInfo);
    const batteryPercentage = batteryInfo[2];
    const chargingState = batteryInfo[3];
    const remaining = batteryInfo[4];
    return {
      batteryPercentage,
      chargingState,
      remaining,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const BAR_WIDTH = 50;

export const renderBatteryGraph = async (data) => {
  const value = Number(data?.batteryPercentage?.replace("%", "")) ?? 0;
  const charging = (data?.chargingState ?? "unknown").replace(/;/g, "").trim();
  const remaining = (data?.remaining ?? "—").trim();

  const barColor = value > 50 ? green : value > 20 ? yellow : red;
  const stateIcon = charging === "charging" ? "⚡" : charging === "charged" ? "✓" : "▼";

  const filled = Math.round((value / 100) * BAR_WIDTH);
  const miniFilled = Math.round((value / 100) * 16);

  const bigBar =
    `${barColor}${"█".repeat(filled)}${reset}` +
    `${dimGrey}${"░".repeat(BAR_WIDTH - filled)}${reset}`;
  const miniBar =
    `${barColor}${"█".repeat(miniFilled)}${reset}` +
    `${dimGrey}${"░".repeat(16 - miniFilled)}${reset}`;

  const lines = [];
  lines.push(`  ${bold}${white}BATTERY${reset}  ${muted}macOS · pmset · ${charging}${reset}`);
  lines.push("");
  lines.push(`  ${bigBar}  ${barColor}${bold}${value}%${reset}`);
  lines.push("");
  lines.push(
    `  ${muted}●${reset}  ${barColor}${bold}${value}%${reset}  ${muted}/ 100%${reset}  ${miniBar}  ${muted}${stateIcon} ${charging} · ${remaining}${reset}`,
  );
  return lines;
};

// setInterval(async () => {
//   const data = await getBatteryData();
//   process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
//   renderBatteryGraph(data);
// }, 1000);
