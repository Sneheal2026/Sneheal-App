export const toLocalPhone = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(-10);
};

export const isValidLocalPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};
