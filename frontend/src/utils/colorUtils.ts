type Rgb = { r: number; g: number; b: number };

const clamp = (value: number, min = 0, max = 255) =>
  Math.min(max, Math.max(min, value));

export const parseHex = (hex: string): Rgb => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

export const toHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b]
    .map((channel) => clamp(channel).toString(16).padStart(2, '0'))
    .join('')}`;

export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mix = (start: number, end: number, weight: number) =>
  Math.round(start + (end - start) * weight);

export const lighten = (hex: string, amount: number): string => {
  const { r, g, b } = parseHex(hex);
  const weight = amount / 100;

  return toHex({
    r: mix(r, 255, weight),
    g: mix(g, 255, weight),
    b: mix(b, 255, weight),
  });
};

export const darken = (hex: string, amount: number): string => {
  const { r, g, b } = parseHex(hex);
  const weight = amount / 100;

  return toHex({
    r: mix(r, 0, weight),
    g: mix(g, 0, weight),
    b: mix(b, 0, weight),
  });
};

export const mixWithWhite = (hex: string, weight: number): string => {
  const { r, g, b } = parseHex(hex);

  return toHex({
    r: mix(r, 255, weight),
    g: mix(g, 255, weight),
    b: mix(b, 255, weight),
  });
};

export const getRelativeLuminance = (hex: string): number => {
  const { r, g, b } = parseHex(hex);
  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const red = toLinear(r);
  const green = toLinear(g);
  const blue = toLinear(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const isPastelColor = (hex: string): boolean => getRelativeLuminance(hex) > 0.62;

/** Darkens very light pastels so buttons and labels stay readable. */
export const ensureReadablePrimary = (hex: string): string =>
  isPastelColor(hex) ? darken(hex, 42) : hex;

/** Convert HSL (h: 0–360, s/l: 0–100) to hex. */
export const hslToHex = (h: number, s: number, l: number): string => {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const m = lightness - chroma / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime < 1) {
    r = chroma;
    g = x;
  } else if (huePrime < 2) {
    r = x;
    g = chroma;
  } else if (huePrime < 3) {
    g = chroma;
    b = x;
  } else if (huePrime < 4) {
    g = x;
    b = chroma;
  } else if (huePrime < 5) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  return toHex({
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  });
};

/** Extract hue (0–360) from a hex color. */
export const hexToHue = (hex: string): number => {
  const { r, g, b } = parseHex(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue = 0;
  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  hue *= 60;
  if (hue < 0) hue += 360;
  return Math.round(hue);
};

/** Saturated accent from a hue — readable on buttons and headers. */
export const hueToBrandHex = (hue: number): string => hslToHex(hue, 72, 46);
