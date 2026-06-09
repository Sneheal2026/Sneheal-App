// Utility functions
// Example: export { formatDate } from './formatDate';

export const formatPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 10) return phone;
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
};

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
