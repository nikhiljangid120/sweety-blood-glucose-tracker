const ReadingService = require('../services/readingService');

class ReadingController {
  constructor(readingService = new ReadingService()) {
    this.readingService = readingService;
  }

  create = async (req, res, next) => {
    try {
      const { date, slot, value, notes } = req.body;
      const reading = await this.readingService.createReading(req.user.id, {
        date,
        slot,
        value,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'Reading added successfully.',
        data: reading,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const date = req.query.date || null;
      const sort = req.query.sort || 'DESC';

      const result = await this.readingService.getReadings(req.user.id, {
        page,
        limit,
        date,
        sort,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const reading = await this.readingService.getReadingById(id, req.user.id);
      return res.status(200).json({
        success: true,
        data: reading,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { date, slot, value, notes } = req.body;
      const updated = await this.readingService.updateReading(id, req.user.id, {
        date,
        slot,
        value,
        notes,
      });

      return res.status(200).json({
        success: true,
        message: 'Reading updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.readingService.deleteReading(id, req.user.id);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ReadingController;
