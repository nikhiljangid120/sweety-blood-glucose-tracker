const ReadingRepository = require('../repositories/readingRepository');

class ReportService {
  constructor(readingRepository = new ReadingRepository()) {
    this.readingRepository = readingRepository;
  }

  /**
   * Helper to format statistics for a list of readings
   */
  computeStatistics(readings) {
    if (!readings || readings.length === 0) {
      return {
        count: 0,
        highest: null,
        lowest: null,
        average: null,
        readings: [],
      };
    }

    const values = readings.map((r) => r.value);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const average = Number((sum / values.length).toFixed(1));

    return {
      count: readings.length,
      highest,
      lowest,
      average,
      readings,
    };
  }

  /**
   * Format date YYYY-MM-DD
   */
  formatDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Get Daily Report for given date
   */
  async getDailyReport(userId, dateStr) {
    const readings = await this.readingRepository.findByUserAndDate(userId, dateStr);
    const stats = this.computeStatistics(readings);
    return {
      type: 'daily',
      selectedDate: dateStr,
      startDate: dateStr,
      endDate: dateStr,
      ...stats,
    };
  }

  /**
   * Get Month-to-date Report (1st of current month to selected date)
   */
  async getMonthToDateReport(userId, dateStr) {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const startDate = `${yearStr}-${monthStr}-01`;
    const endDate = dateStr;

    const readings = await this.readingRepository.findByUserAndDateRange(userId, startDate, endDate);
    const stats = this.computeStatistics(readings);

    return {
      type: 'month-to-date',
      selectedDate: dateStr,
      startDate,
      endDate,
      ...stats,
    };
  }

  /**
   * Get Monthly Report (The whole previous month)
   */
  async getMonthlyReport(userId, dateStr) {
    const [yearStr, monthStr] = dateStr.split('-');
    const currentYear = parseInt(yearStr, 10);
    const currentMonth = parseInt(monthStr, 10); // 1-12

    // Previous month calculation
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const prevMonthFormatted = String(prevMonth).padStart(2, '0');
    const startDate = `${prevYear}-${prevMonthFormatted}-01`;

    // Last day of previous month: day 0 of currentMonth in JavaScript Date gives last day of prev month
    const lastDayOfMonth = new Date(prevYear, prevMonth, 0).getDate();
    const endDate = `${prevYear}-${prevMonthFormatted}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const readings = await this.readingRepository.findByUserAndDateRange(userId, startDate, endDate);
    const stats = this.computeStatistics(readings);

    return {
      type: 'monthly',
      selectedDate: dateStr,
      startDate,
      endDate,
      ...stats,
    };
  }

  /**
   * Get combined summary reports for dashboard / reports view
   */
  async getAllReports(userId, dateStr) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    const [daily, monthToDate, monthly] = await Promise.all([
      this.getDailyReport(userId, targetDate),
      this.getMonthToDateReport(userId, targetDate),
      this.getMonthlyReport(userId, targetDate),
    ]);

    return {
      selectedDate: targetDate,
      daily,
      monthToDate,
      monthly,
    };
  }
}

module.exports = ReportService;
