export const LIGHT_BLUE = '#74B9FF';
export const LIGHT_GRAY = '#E5E5EA';
export const LIGHTEST_GRAY = '#F5F5F7';
export const GRAY = '#8E8E93';
export const DARK_GRAY = '#3A3A3C';
export const DARKEST_GRAY = '#1C1C1E';
export const BLUE = '#007AFF';
export const GREEN = '#34C759';
export const LIGHT_GREEN = '#66D17A';
export const RED = '#FF3B30';
export const LIGHT_RED = '#FF6B6B';
export const YELLOW = '#FFD60A';
export const ORANGE = '#FF9500';

export function colorNameToHex(colorName: string): string {
  switch (colorName.toLowerCase()) {
    case 'yellow':
      return YELLOW;
    case 'green':
      return GREEN;
    case 'red':
      return RED;
    case 'blue':
      return BLUE;
    case 'light_blue':
      return LIGHT_BLUE;
    case 'light_gray':
      return LIGHT_GRAY;
    case 'lightest_gray':
      return LIGHTEST_GRAY;
    case 'gray':
      return GRAY;
    case 'dark_gray':
      return DARK_GRAY;
    case 'darkest_gray':
      return DARKEST_GRAY;
    case 'light_green':
      return LIGHT_GREEN;
    case 'light_red':
      return LIGHT_RED;
    case 'orange':
      return ORANGE;
    default:
      // If it's not a recognized color name, assume it's already a hex or an invalid color
      return colorName;
  }
}

export function withAlpha(hex: string, alpha: number): string {
  // hex like #RRGGBB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getLedTone(color: string): string {
  // Normalize greens and reds to match the reference tones
  // Softer green and red while keeping others unchanged
  const lower = color.toLowerCase();
  if (lower === GREEN.toLowerCase() || lower === LIGHT_GREEN.toLowerCase()) {
    return '#22C55E'; // Tailwind emerald-500 like
  }
  if (lower === RED.toLowerCase() || lower === LIGHT_RED.toLowerCase()) {
    return '#EF4444'; // Tailwind red-500 like
  }
  return color;
}
