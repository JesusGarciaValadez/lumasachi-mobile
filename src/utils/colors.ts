export const lightenColor = (hex: string, percent: number): string => {
  if (!/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
    // Not a valid hex color, return original
    return hex;
  }

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, r + (255 - r) * (percent / 100));
  g = Math.min(255, g + (255 - g) * (percent / 100));
  b = Math.min(255, b + (255 - b) * (percent / 100));

  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
