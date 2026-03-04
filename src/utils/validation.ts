// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe incluir número');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Debe incluir carácter especial (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

export const validateAge = (age: number): boolean => {
  return age >= 1 && age <= 120;
};

export const validateHeight = (height: number): boolean => {
  return height >= 50 && height <= 250;
};

export const validateDateNotFuture = (date: string): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();
  return selectedDate <= today;
};

export const validateIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};
