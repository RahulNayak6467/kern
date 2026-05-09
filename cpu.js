import { exec } from "child_process";
import { get } from "https";
import { convertProcessSignalToExitCode, promisify } from "util";
const execPromise = promisify(exec);

const red = "\x1b[38;2;255;75;75m";
const green = "\x1b[38;2;0;245;175m";
const yellow = "\x1b[38;2;255;175;0m";
const dimGrey = "\x1b[38;2;45;48;65m";
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const white = "\x1b[38;2;210;215;230m";
const muted = "\x1b[38;2;85;90;110m";
const orange = "\x1b[38;2;255;140;0m";
const purple = "\x1b[38;2;199;125;255m";
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const visLen = (s) => stripAnsi(s).length;

const getColor = (data) => {
  const value = 100 - Number(data?.replace("%", ""));
  if (value < 30) return green;
  else if (value < 60) return yellow;
  else if (value < 90) return orange;
  return red;
};

export const getCPUData = async () => {
  try {
    const { stderr, stdout } = await execPromise("top -l 2 -n 0");
    if (stderr) throw new Error(stderr);
    // console.log(stdout.split("\n")[3]);
    const data = stdout.split("\n")[3].split(" ")[6];
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const history = [];
export const renderCPUGraph = async (data) => {
  if (history.length > 100) history.shift();
  history.push(data);

  const idle = Number(data?.replace("%", ""));
  const usage = parseFloat((100 - idle).toFixed(1));
  const currentColor = getColor(data);

  const lines = [];
  lines.push(
    `  ${bold}${white}CPU USAGE${reset}  ${muted}macOS · top · ${history.length} samples · %${reset}`,
  );
  lines.push("");

  for (let i = 10; i >= 1; i--) {
    const labelStr = i % 2 === 0 ? String(i * 10).padStart(3) : "   ";
    let row = `  ${muted}${labelStr} ┤${reset}`;
    for (let j = 0; j < history.length; j++) {
      const value = Number(history[j].replace("%", ""));
      if ((100 - value) / 10 > i) {
        row += getColor(history[j]) + "█" + reset;
      } else {
        row += dimGrey + "░" + reset;
      }
    }
    lines.push(row);
  }

  lines.push(`  ${muted}  0 └${"─".repeat(history.length)}${reset}`);
  lines.push("");

  const filled = Math.round((usage / 100) * 16);
  const bar =
    `${currentColor}${"█".repeat(filled)}${reset}` +
    `${muted}${"░".repeat(16 - filled)}${reset}`;
  lines.push(
    `  ${muted}●${reset}  ${currentColor}${bold}${usage}%${reset}  ${muted}/ 100%${reset}  ${bar}  ${currentColor}${bold}cpu${reset}`,
  );

  return lines;
};

// setInterval(async () => {
//   const data = await getCPUData();
//   process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
//   renderCPUGraph(data);
// }, 1000);

const getPerCoreData = async () => {
  try {
    const { stderr, stdout } = await execPromise(
      "sudo sudo powermetrics --samplers cpu_power -n 1 --sample-rate 1000",
    );
    if (stderr) throw new Error(stderr);
    const data = stdout
      .split("\n")
      .filter((el) => el.includes("active residency"))
      .filter((el) => el.includes("CPU"));

    const P0Cluster = data.slice(0, 5);
    const P1Cluster = data.slice(5, 10);
    const SCluster = data.slice(10, 15);

    // console.log(P1Cluster);
    // console.log(SCluster);

    return { P0Cluster, P1Cluster, SCluster };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const formatPercoreData = async () => {
  const { P0Cluster, P1Cluster, SCluster } = await getPerCoreData();
  const P0 = P0Cluster.map((el) => el.replace(/\s/g, " ").split(" "));
  const P1 = P1Cluster.map((el) => el.replace(/\s/g, " ").split(" "));
  const S = SCluster.map((el) => el.replace(/\s/g, " ").split(" "));

  const P0Usage = P0.map((el) => Number(el[5].replace("%", "")));
  const P1Usage = P1.map((el) => Number(el[5].replace("%", "")));
  const SUsage = S.map((el) => Number(el[5].replace("%", "")));

  const requiredData = {
    p0: {
      clusterUsage: P0Usage.reduce((a, b) => a + b, 0),
      cores: P0Usage,
    },
    p1: {
      clusterUsage: P1Usage.reduce((a, b) => a + b, 0),
      cores: P1Usage,
    },
    s: {
      clusterUsage: SUsage.reduce((a, b) => a + b, 0),
      cores: SUsage,
    },
  };

  return requiredData;
};

const MAX_HEIGHT = 4;
const HIST_W = 14;
const histories = Array.from({ length: 15 }, () => []);

const getPercoreColor = (data) => {
  if (data < 25) return green;
  else if (data < 50) return yellow;
  else if (data < 80) return orange;
  else return red;
};

const buildCoreCell = (coreIdx, value) => {
  const hist = histories[coreIdx];
  if (hist.length >= HIST_W) hist.shift();
  hist.push(value ?? 0);

  const v = value ?? 0;
  const c = getPercoreColor(v);
  const pct = `${v.toFixed(1)}%`;
  const coreLabel = `C${coreIdx % 5}`;
  const trailing = HIST_W - hist.length;

  const lines = [];

  // top border: ┌─ Cx ─────────┐  (HIST_W inner chars)
  const topFill = HIST_W - 2 - coreLabel.length - 1;
  lines.push(
    `${purple}┌${muted}─ ${reset}${bold}${white}${coreLabel}${reset}${muted} ${"─".repeat(topFill)}${purple}┐${reset}`,
  );

  // percentage row — centered inside the box
  const lp = Math.floor((HIST_W - pct.length) / 2);
  const rp = HIST_W - pct.length - lp;
  lines.push(
    `${purple}│${reset}${" ".repeat(lp)}${c}${bold}${pct}${reset}${" ".repeat(rp)}${purple}│${reset}`,
  );

  for (let i = MAX_HEIGHT; i >= 0; i--) {
    let row = "";
    for (let j = 0; j < hist.length; j++) {
      const hv = hist[j] ?? 0;
      if (hv / 20 + 1 > i || (hv === 0 && i === 0)) {
        row += getPercoreColor(hv) + "█" + reset;
      } else {
        row += dimGrey + "░" + reset;
      }
    }
    if (trailing > 0) row += dimGrey + "░".repeat(trailing) + reset;
    lines.push(`${purple}│${reset}${row}${purple}│${reset}`);
  }

  lines.push(`${purple}├${muted}${"─".repeat(HIST_W)}${purple}┤${reset}`);

  const filled = Math.round((v / 100) * HIST_W);
  const miniBar =
    c +
    "█".repeat(filled) +
    reset +
    dimGrey +
    "░".repeat(HIST_W - filled) +
    reset;
  lines.push(`${purple}│${reset}${miniBar}${purple}│${reset}`);

  lines.push(`${purple}└${muted}${"─".repeat(HIST_W)}${purple}┘${reset}`);

  return lines;
};

// layout constants: 5 cells × (HIST_W+2) + 4 gaps × 2 = 88 wide content block
const CONTENT_W = 5 * (HIST_W + 2) + 4 * 2;
const INNER_W = CONTENT_W - 2;

export const renderPerCoreGrid = (clusterData) => {
  const clusters = [
    { name: "EFFICIENCY", short: "P0", data: clusterData?.p0, base: 0 },
    { name: "PERFORMANCE", short: "P1", data: clusterData?.p1, base: 5 },
    { name: "SUPER", short: "S", data: clusterData?.s, base: 10 },
  ];

  // panel header box
  const titleStr = `${bold}${white}◈  PER-CORE CPU${reset}`;
  const sepStr = `${muted}  ·  ${reset}`;
  const subStr = `${muted}powermetrics · 5 × 3 clusters${reset}`;
  const headerContent = `  ${titleStr}${sepStr}${subStr}`;
  const headerPad =
    INNER_W - 2 - visLen(titleStr) - visLen(sepStr) - visLen(subStr) - 2;
  process.stdout.write(`\n  ${purple}╭${"─".repeat(INNER_W)}╮${reset}\n`);
  process.stdout.write(
    `  ${purple}│${reset}${headerContent}${" ".repeat(Math.max(0, headerPad))}  ${purple}│${reset}\n`,
  );
  process.stdout.write(`  ${purple}╰${"─".repeat(INNER_W)}╯${reset}\n\n`);

  for (const { name, short, data, base } of clusters) {
    const cores = data?.cores ?? Array(5).fill(0);
    const avg = (data?.clusterUsage ?? 0) / cores.length;
    const avgC = getPercoreColor(avg);

    // cluster header rule spanning full content width
    const labelPart = `${short} · ${name}`;
    const avgStr = `${avg.toFixed(1)}% avg`;
    const dashFill = CONTENT_W - 8 - labelPart.length - avgStr.length;
    process.stdout.write(
      `  ${muted}── ${reset}${bold}${white}${labelPart}${reset}${muted} ${"─".repeat(Math.max(2, dashFill))} ${reset}${avgC}${bold}${avgStr}${reset}${muted} ──${reset}\n\n`,
    );

    const cells = cores.map((v, i) => buildCoreCell(base + i, v));
    const numLines = cells[0].length;

    for (let li = 0; li < numLines; li++) {
      process.stdout.write("  ");
      cells.forEach((cell, ci) => {
        process.stdout.write(cell[li]);
        if (ci < cells.length - 1) process.stdout.write("  ");
      });
      process.stdout.write("\n");
    }

    process.stdout.write("\n");
  }
};

// setInterval(async () => {
//   const { p0, p1, s } = await formatPercoreData();
//   process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
//   renderPerCoreGrid({ p0, p1, s });
// }, 1000);
// renderPerCoreGrid();
