const ReportService = require('../src/services/reportService');

describe('ReportService', () => {
  let mockReadingRepo;
  let reportService;

  beforeEach(() => {
    mockReadingRepo = {
      findByUserAndDate: jest.fn(),
      findByUserAndDateRange: jest.fn(),
    };
    reportService = new ReportService(mockReadingRepo);
  });

  test('computes highest, lowest, and average rounded to 1 decimal place', async () => {
    const mockReadings = [
      { id: 1, slot: 'Morning (fasting)', value: 95 },
      { id: 2, slot: 'After breakfast', value: 142 },
      { id: 3, slot: 'After lunch', value: 125 },
    ];
    mockReadingRepo.findByUserAndDate.mockResolvedValue(mockReadings);

    const report = await reportService.getDailyReport(1, '2026-10-15');

    // Values: 95, 142, 125.
    // Sum = 362. Average = 362 / 3 = 120.6666... -> rounded to 1 decimal = 120.7
    expect(report.count).toBe(3);
    expect(report.highest).toBe(142);
    expect(report.lowest).toBe(95);
    expect(report.average).toBe(120.7);
    expect(report.readings.length).toBe(3);
  });

  test('returns friendly empty state values when no readings exist', async () => {
    mockReadingRepo.findByUserAndDate.mockResolvedValue([]);

    const report = await reportService.getDailyReport(1, '2026-10-15');

    expect(report.count).toBe(0);
    expect(report.highest).toBeNull();
    expect(report.lowest).toBeNull();
    expect(report.average).toBeNull();
    expect(report.readings).toEqual([]);
  });

  test('computes correct previous month date range for Monthly report', async () => {
    mockReadingRepo.findByUserAndDateRange.mockResolvedValue([]);

    const report = await reportService.getMonthlyReport(1, '2026-10-15');

    // Selected: 15 Oct 2026. Previous month is September 2026: 1 Sep 2026 to 30 Sep 2026.
    expect(report.startDate).toBe('2026-09-01');
    expect(report.endDate).toBe('2026-09-30');
    expect(mockReadingRepo.findByUserAndDateRange).toHaveBeenCalledWith(1, '2026-09-01', '2026-09-30');
  });

  test('computes correct month-to-date range', async () => {
    mockReadingRepo.findByUserAndDateRange.mockResolvedValue([]);

    const report = await reportService.getMonthToDateReport(1, '2026-10-15');

    // Selected: 15 Oct 2026 -> 1 Oct 2026 to 15 Oct 2026
    expect(report.startDate).toBe('2026-10-01');
    expect(report.endDate).toBe('2026-10-15');
    expect(mockReadingRepo.findByUserAndDateRange).toHaveBeenCalledWith(1, '2026-10-01', '2026-10-15');
  });
});
