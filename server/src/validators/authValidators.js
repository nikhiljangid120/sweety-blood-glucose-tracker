class AuthValidators {
  static validateRegister({ name, email, password }) {
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required.' });
    }

    if (!email || typeof email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required.' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Please provide a valid email address.' });
      }
    }

    if (!password || typeof password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required.' });
    } else if (password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateLogin({ email, password }) {
    const errors = [];

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email is required.' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      errors.push({ field: 'password', message: 'Password is required.' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = AuthValidators;
