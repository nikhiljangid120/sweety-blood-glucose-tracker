const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

class ReadingValidators {
  static get ALLOWED_SLOTS() {
    return ALLOWED_SLOTS;
  }

  static validatePayload({ date, slot, value }) {
    const errors = [];

    // 1. Date validation
    if (!date) {
      errors.push({ field: 'date', message: 'Date is required.' });
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        errors.push({ field: 'date', message: 'Date must be formatted as YYYY-MM-DD.' });
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        if (date > todayStr) {
          errors.push({ field: 'date', message: 'Date cannot be in the future.' });
        }
      }
    }

    // 2. Slot validation
    if (!slot) {
      errors.push({ field: 'slot', message: 'Time slot is required.' });
    } else if (!ALLOWED_SLOTS.includes(slot)) {
      errors.push({
        field: 'slot',
        message: `Slot must be one of: ${ALLOWED_SLOTS.join(', ')}.`,
      });
    }

    // 3. Value validation
    // Rule 1: Value is required -> "Please enter a glucose value."
    if (value === undefined || value === null || value === '') {
      errors.push({ field: 'value', message: 'Please enter a glucose value.' });
    } else {
      const numVal = Number(value);
      // Rule 2: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."
      if (!Number.isInteger(numVal) || numVal < 40 || numVal > 600) {
        errors.push({
          field: 'value',
          message: 'Value must be between 40 and 600 mg/dl.',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = ReadingValidators;
