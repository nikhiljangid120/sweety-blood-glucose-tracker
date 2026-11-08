const ReadingValidators = require('../src/validators/readingValidators');

describe('ReadingValidators', () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  describe('Value validation', () => {
    test('rejects missing or empty value with "Please enter a glucose value."', () => {
      const res1 = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Morning (fasting)',
        value: '',
      });
      expect(res1.isValid).toBe(false);
      expect(res1.errors[0].message).toBe('Please enter a glucose value.');

      const res2 = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Morning (fasting)',
        value: undefined,
      });
      expect(res2.isValid).toBe(false);
      expect(res2.errors[0].message).toBe('Please enter a glucose value.');
    });

    test('rejects values below 40 with "Value must be between 40 and 600 mg/dl."', () => {
      const res = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Morning (fasting)',
        value: 39,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0].message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects values above 600 with "Value must be between 40 and 600 mg/dl."', () => {
      const res = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Morning (fasting)',
        value: 601,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0].message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects non-integer decimal values', () => {
      const res = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Morning (fasting)',
        value: 120.5,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0].message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('accepts valid whole number values between 40 and 600', () => {
      const res = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Morning (fasting)',
        value: 105,
      });
      expect(res.isValid).toBe(true);
      expect(res.errors.length).toBe(0);
    });
  });

  describe('Date validation', () => {
    test('rejects future dates with "Date cannot be in the future."', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureStr = futureDate.toISOString().split('T')[0];

      const res = ReadingValidators.validatePayload({
        date: futureStr,
        slot: 'Morning (fasting)',
        value: 110,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0].message).toBe('Date cannot be in the future.');
    });

    test('accepts today or past date', () => {
      const res = ReadingValidators.validatePayload({
        date: '2025-01-01',
        slot: 'Morning (fasting)',
        value: 110,
      });
      expect(res.isValid).toBe(true);
    });
  });

  describe('Slot validation', () => {
    test('accepts all 4 valid slots', () => {
      for (const slot of ReadingValidators.ALLOWED_SLOTS) {
        const res = ReadingValidators.validatePayload({
          date: getTodayStr(),
          slot,
          value: 110,
        });
        expect(res.isValid).toBe(true);
      }
    });

    test('rejects unknown slots', () => {
      const res = ReadingValidators.validatePayload({
        date: getTodayStr(),
        slot: 'Midnight snack',
        value: 110,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0].field).toBe('slot');
    });
  });
});
