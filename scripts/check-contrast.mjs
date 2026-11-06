import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8');

function readThemeTokens(selectorPattern) {
  const block = css.match(
    new RegExp(`${selectorPattern}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
  )?.[1];
  if (!block) throw new Error(`Could not find token block for ${selector}`);

  const tokens = new Map();
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{3,8});/g)) {
    tokens.set(name, value);
  }
  return tokens;
}

function toRgb(hex) {
  const value = hex.slice(1);
  const digits =
    value.length === 3
      ? [...value].map((digit) => digit + digit).join('')
      : value.slice(0, 6);
  if (digits.length !== 6) throw new Error(`Unsupported color value: ${hex}`);
  return [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16));
}

function luminance(hex) {
  const [red, green, blue] = toRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const checks = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface-2', 4.5],
  ['accent-text', 'bg', 4.5],
  ['border', 'bg', 3],
  ['danger', 'bg', 4.5],
  ['danger', 'surface', 4.5],
  ['on-brand', 'brand', 4.5],
  ['on-danger', 'danger', 4.5],
  ['text-placeholder', 'surface', 4.5],
];

const themes = [
  ['dark', readThemeTokens(':root,\\s*\\[data-theme="dark"\\]')],
  ['light', readThemeTokens('\\[data-theme="light"\\]')],
];
let failed = false;

for (const [theme, tokens] of themes) {
  console.log(`${theme} theme:`);
  for (const [foregroundName, backgroundName, threshold] of checks) {
    const foreground = tokens.get(foregroundName);
    const background = tokens.get(backgroundName);
    if (!foreground || !background) {
      throw new Error(
        `Missing --${!foreground ? foregroundName : backgroundName} in ${theme} tokens`
      );
    }

    const ratio = contrast(foreground, background);
    const passes = ratio >= threshold;
    failed ||= !passes;
    console.log(
      `  ${passes ? 'PASS' : 'FAIL'} --${foregroundName} / --${backgroundName}: ` +
        `${ratio.toFixed(2)}:1 (required ${threshold}:1)`
    );
  }
}

if (failed) process.exitCode = 1;
