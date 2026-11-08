const ReportService = require('../services/reportService');

class ReportController {
  constructor(reportService = new ReportService()) {
    this.reportService = reportService;
  }

  getAll = async (req, res, next) => {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const reports = await this.reportService.getAllReports(req.user.id, date);
      return res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  };

  getDaily = async (req, res, next) => {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const report = await this.reportService.getDailyReport(req.user.id, date);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  getMonthToDate = async (req, res, next) => {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const report = await this.reportService.getMonthToDateReport(req.user.id, date);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  getMonthly = async (req, res, next) => {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const report = await this.reportService.getMonthlyReport(req.user.id, date);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ReportController;
