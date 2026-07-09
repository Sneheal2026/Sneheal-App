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
