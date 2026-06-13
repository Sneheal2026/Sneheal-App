export const devLog = (tag: string, message: string, data?: unknown): void => {
  if (!__DEV__) return;

  const prefix = `[Sneheal:${tag}]`;
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
};
