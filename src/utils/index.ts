// Export all utilities from this file

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};