# kern

A real-time macOS terminal system monitor built in pure Node.js with zero external dependencies.

https://github.com/user-attachments/assets/445f21bf-514f-421c-955e-2213f50c1219


---

## Overview

kern renders live graphs for CPU, memory, disk, network and battery directly in your terminal using ANSI escape codes and unicode block characters. No Electron, no browser, no frameworks — just Node.js and your terminal.

One of the core challenges was that macOS does not expose system metrics as structured data. Every CLI tool outputs human-readable text designed for terminal display, not programmatic parsing. This meant building reliable parsers for each tool — handling inconsistent spacing, stripping trailing characters, extracting values from unstructured text, and gracefully handling edge cases when output varies.

This is fundamentally different from Linux where `/proc` exposes system data as clean, structured files that can be read directly without spawning processes or parsing text.

---

## What it shows

| Metric | Source | Details |
|--------|--------|---------|
| RAM | `vm_stat` | active + wired + compressed memory |
| Disk I/O | `iostat` | read/write throughput in MB/s |
| Network | `netstat` | download/upload speed in KB/s |
| Battery | `pmset` | percentage, status, time remaining |
| CPU | `top` | overall usage % with rolling graph |
| Per-core CPU | `powermetrics` | per-core across P0/P1/S clusters |
| System info | `os` module | hostname, user, shell, uptime, load avg |

---

## Requirements

- macOS (Apple Silicon)
- Node.js 18+

---

## Setup

```bash
git clone https://github.com/RahulNayak6467/kern.git
cd kern
npm link
```

Run from anywhere:

```bash
kern
```

---

## Per-core CPU 

Per-core CPU graphs use `powermetrics` which requires passwordless sudo. One time setup:

```bash
sudo visudo
```

Add this line at the bottom — replace `username` with your Mac username:
