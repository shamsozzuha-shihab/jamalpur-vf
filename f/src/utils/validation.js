// Email validation utility
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Name validation utility
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

// Phone validation utility
export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

// Password validation utility
export const validatePassword = (password) => {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers
  };
};

// Form validation messages
export const validationMessages = {
  email: {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address (e.g., user@example.com)',
    format: 'Email must contain @ symbol and valid domain'
  },
  name: {
    required: 'Full name is required',
    invalid: 'Name must contain only letters and spaces (2-50 characters)',
    minLength: 'Name must be at least 2 characters long',
    maxLength: 'Name must not exceed 50 characters'
  },
  phone: {
    invalid: 'Please enter a valid phone number',
    format: 'Phone number should contain only digits, spaces, hyphens, and parentheses'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 6 characters long',
    weak: 'Password must contain uppercase, lowercase, and numbers',
    mismatch: 'Passwords do not match'
  }
};
