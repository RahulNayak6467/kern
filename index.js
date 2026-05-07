import os from "os";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const user = os.userInfo();
const host = os.hostname();
const ram = Math.floor(os.totalmem() / (1024 * 1024 * 1000));
const uptime = os.uptime();
const loadavg = os.loadavg().map((el) => el.toFixed(2));

const getUptime = () => {
  const day = uptime / (24 * 60 * 60);
  const hour = (uptime % (24 * 60 * 60)) / (60 * 60);
  const minute = (uptime % (60 * 60)) / 60;
  const second = uptime % 60;
  return `${day.toFixed(0)}d ${hour.toFixed(0)}h ${minute.toFixed(0)}m ${second.toFixed(0)}s`;
};

const cpuInfo = os.cpus();

const color = {
  green: "\x1b[38;2;0;230;118m",
  yellow: "\x1b[38;2;255;215;0m",
  orange: "\x1b[38;2;255;140;0m",
  red: "\x1b[38;2;255;68;68m",
  cyan: "\x1b[38;2;0;229;255m",
  blue: "\x1b[38;2;0;180;216m",
  purple: "\x1b[38;2;199;125;255m",
  grey: "\x1b[38;2;170;170;170m",
  darkGrey: "\x1b[38;2;85;85;85m",
  reset: "\x1b[0m",
};

const bold = "\x1b[1m";

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const visLen = (s) => stripAnsi(s).length;

const loadStr = loadavg
  .map((l) => {
    const n = parseFloat(l);
    const c = n > 6 ? color.red : n > 3 ? color.orange : color.green;
    return `${c}${l}${color.reset}`;
  })
  .join("  ");

const items = [
  { label: "user", value: `${color.cyan}${user.username}${color.reset}` },
  { label: "host", value: `${color.cyan}${host}${color.reset}` },
  { label: "shell", value: `${color.cyan}${user.shell}${color.reset}` },
  {
    label: "os",
    value: `macOS Tahoe ${color.grey}${os.release()}${color.reset}`,
  },
  {
    label: "cpu",
    value: `${cpuInfo[0].model}  ${color.grey}${cpuInfo.length} cores${color.reset}`,
  },
  { label: "ram", value: `${ram} GB` },
  { label: "uptime", value: `${color.cyan}${getUptime()}${color.reset}` },
  { label: "load", value: loadStr },
  { label: "arch", value: `${color.cyan}${os.arch()}${color.reset}` },
];

const COLS = 3;
const LPAD = 1;
const LABEL_W = 6;
const SEP_W = 3; // " · "

const colWidths = Array(COLS).fill(0);
for (let i = 0; i < items.length; i++) {
  const col = i % COLS;
  const w = LPAD + LABEL_W + SEP_W + visLen(items[i].value) + 1;
  colWidths[col] = Math.max(colWidths[col], w);
}

const pu = color.purple;
const re = color.reset;

const hRule = (left, mid, right) => {
  const inner = colWidths.map((w) => "─".repeat(w)).join(mid);
  return "  " + pu + left + inner + right + re;
};

const renderRow = (rowIdx) => {
  let line = "  ";
  for (let col = 0; col < COLS; col++) {
    const { label, value } = items[rowIdx * COLS + col];
    const contentVis = LPAD + LABEL_W + SEP_W + visLen(value);
    const rpad = colWidths[col] - contentVis;
    line +=
      `${pu}│${re}` +
      " ".repeat(LPAD) +
      `${color.darkGrey}${label.padEnd(LABEL_W)}${re}` +
      `${color.darkGrey} · ${re}` +
      value +
      " ".repeat(rpad);
  }
  return line + `${pu}│${re}`;
};

(async () => {
  //   const vmData = await getVMStat();

  // header
  const hLine = "─".repeat(14);
  console.log();
  console.log(`  ${pu}╭${hLine}╮${re}`);
  console.log(
    `  ${pu}│${re}  ${color.cyan}◈${re}  ${bold}sysinfo${re}  ${pu}│${re}`,
  );
  console.log(`  ${pu}╰${hLine}╯${re}`);
  console.log();

  const uhText = `${user.username} @ ${host}`;
  console.log(
    `  ${color.cyan}${bold}${user.username}${re}${color.darkGrey} @ ${re}${color.green}${bold}${host}${re}`,
  );
  console.log(`  ${color.darkGrey}${"─".repeat(uhText.length)}${re}`);
  console.log();

  // 3×3 grid
  console.log(hRule("╭", "┬", "╮"));
  for (let row = 0; row < 3; row++) {
    console.log(renderRow(row));
    if (row < 2) console.log(hRule("├", "┼", "┤"));
  }
  console.log(hRule("╰", "┴", "╯"));
  console.log();
})();
