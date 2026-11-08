const ReadingService = require('../src/services/readingService');

describe('ReadingService Business Rules', () => {
  let mockReadingRepo;
  let readingService;

  beforeEach(() => {
    mockReadingRepo = {
      create: jest.fn(),
      findByIdAndUser: jest.fn(),
      findSlotConflict: jest.fn(),
      countByUserAndDate: jest.fn(),
      findAllByUser: jest.fn(),
      findByUserAndDate: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    readingService = new ReadingService(mockReadingRepo);
  });

  test('enforces rule: Only one reading per slot per day', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockReadingRepo.findSlotConflict.mockResolvedValue({ id: 10, slot: 'After lunch' });

    await expect(
      readingService.createReading(1, {
        date: today,
        slot: 'After lunch',
        value: 130,
      })
    ).rejects.toThrow('You already have an After lunch reading for this date.');

    expect(mockReadingRepo.create).not.toHaveBeenCalled();
  });

  test('enforces rule: Maximum 4 readings per day', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockReadingRepo.findSlotConflict.mockResolvedValue(null);
    mockReadingRepo.countByUserAndDate.mockResolvedValue(4);

    await expect(
      readingService.createReading(1, {
        date: today,
        slot: 'After dinner',
        value: 140,
      })
    ).rejects.toThrow('You can add only 4 readings per day.');

    expect(mockReadingRepo.create).not.toHaveBeenCalled();
  });

  test('successfully creates reading when within limits and slot is free', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockReadingRepo.findSlotConflict.mockResolvedValue(null);
    mockReadingRepo.countByUserAndDate.mockResolvedValue(2);
    mockReadingRepo.create.mockResolvedValue({
      id: 99,
      user_id: 1,
      date: today,
      slot: 'Morning (fasting)',
      value: 95,
      notes: null,
    });

    const result = await readingService.createReading(1, {
      date: today,
      slot: 'Morning (fasting)',
      value: 95,
    });

    expect(result.id).toBe(99);
    expect(mockReadingRepo.create).toHaveBeenCalledWith({
      userId: 1,
      date: today,
      slot: 'Morning (fasting)',
      value: 95,
      notes: null,
    });
  });

  test('update allows editing existing reading without counting it against slot or limit duplicate', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockReadingRepo.findByIdAndUser.mockResolvedValue({
      id: 12,
      user_id: 1,
      date: today,
      slot: 'Morning (fasting)',
      value: 95,
      notes: 'Initial note',
    });
    mockReadingRepo.findSlotConflict.mockResolvedValue(null);
    mockReadingRepo.countByUserAndDate.mockResolvedValue(3);
    mockReadingRepo.update.mockResolvedValue({
      id: 12,
      user_id: 1,
      date: today,
      slot: 'Morning (fasting)',
      value: 102,
      notes: 'Updated note',
    });

    const updated = await readingService.updateReading(12, 1, {
      date: today,
      slot: 'Morning (fasting)',
      value: 102,
      notes: 'Updated note',
    });

    expect(updated.value).toBe(102);
    expect(mockReadingRepo.findSlotConflict).toHaveBeenCalledWith(1, today, 'Morning (fasting)', 12);
  });
});
