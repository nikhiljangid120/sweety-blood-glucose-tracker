const ReadingRepository = require('../repositories/readingRepository');
const ReadingValidators = require('../validators/readingValidators');

class ReadingService {
  constructor(readingRepository = new ReadingRepository()) {
    this.readingRepository = readingRepository;
  }

  async createReading(userId, { date, slot, value, notes }) {
    // 1. Structural and field validations
    const validation = ReadingValidators.validatePayload({ date, slot, value });
    if (!validation.isValid) {
      const error = new Error(validation.errors[0].message);
      error.statusCode = 400;
      error.errors = validation.errors;
      throw error;
    }

    // 2. Check rule: Only one reading per slot per day
    const existingSlotReading = await this.readingRepository.findSlotConflict(userId, date, slot);
    if (existingSlotReading) {
      const error = new Error(`You already have an ${slot} reading for this date.`);
      error.statusCode = 409;
      throw error;
    }

    // 3. Check rule: Maximum 4 readings per day
    const dayCount = await this.readingRepository.countByUserAndDate(userId, date);
    if (dayCount >= 4) {
      const error = new Error('You can add only 4 readings per day.');
      error.statusCode = 400;
      throw error;
    }

    return await this.readingRepository.create({
      userId,
      date,
      slot,
      value: Number(value),
      notes: notes ? notes.trim() : null,
    });
  }

  async updateReading(id, userId, { date, slot, value, notes }) {
    const existingReading = await this.readingRepository.findByIdAndUser(id, userId);
    if (!existingReading) {
      const error = new Error('Reading not found.');
      error.statusCode = 404;
      throw error;
    }

    // 1. Structural and field validations
    const targetDate = date || existingReading.date;
    const targetSlot = slot || existingReading.slot;
    const targetValue = value !== undefined ? value : existingReading.value;
    const targetNotes = notes !== undefined ? notes : existingReading.notes;

    const validation = ReadingValidators.validatePayload({
      date: targetDate,
      slot: targetSlot,
      value: targetValue,
    });
    if (!validation.isValid) {
      const error = new Error(validation.errors[0].message);
      error.statusCode = 400;
      error.errors = validation.errors;
      throw error;
    }

    // 2. Check rule: Only one reading per slot per day (excluding this reading)
    const slotConflict = await this.readingRepository.findSlotConflict(userId, targetDate, targetSlot, id);
    if (slotConflict) {
      const error = new Error(`You already have an ${targetSlot} reading for this date.`);
      error.statusCode = 409;
      throw error;
    }

    // 3. Check rule: Maximum 4 readings per day (excluding this reading)
    const dayCount = await this.readingRepository.countByUserAndDate(userId, targetDate, id);
    if (dayCount >= 4) {
      const error = new Error('You can add only 4 readings per day.');
      error.statusCode = 400;
      throw error;
    }

    return await this.readingRepository.update(id, userId, {
      date: targetDate,
      slot: targetSlot,
      value: Number(targetValue),
      notes: targetNotes ? targetNotes.trim() : null,
    });
  }

  async deleteReading(id, userId) {
    const existingReading = await this.readingRepository.findByIdAndUser(id, userId);
    if (!existingReading) {
      const error = new Error('Reading not found.');
      error.statusCode = 404;
      throw error;
    }
    await this.readingRepository.delete(id, userId);
    return { success: true, message: 'Reading deleted successfully.' };
  }

  async getReadingById(id, userId) {
    const reading = await this.readingRepository.findByIdAndUser(id, userId);
    if (!reading) {
      const error = new Error('Reading not found.');
      error.statusCode = 404;
      throw error;
    }
    return reading;
  }

  async getReadings(userId, options = {}) {
    return await this.readingRepository.findAllByUser(userId, options);
  }

  async getReadingsByDate(userId, date) {
    return await this.readingRepository.findByUserAndDate(userId, date);
  }
}

module.exports = ReadingService;
