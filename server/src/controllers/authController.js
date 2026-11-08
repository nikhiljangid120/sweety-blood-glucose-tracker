const AuthService = require('../services/authService');
const AuthValidators = require('../validators/authValidators');

class AuthController {
  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const validation = AuthValidators.validateRegister({ name, email, password });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors[0].message,
          errors: validation.errors,
        });
      }

      const result = await this.authService.register({ name, email, password });
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const validation = AuthValidators.validateLogin({ email, password });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors[0].message,
          errors: validation.errors,
        });
      }

      const result = await this.authService.login({ email, password });
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req, res, next) => {
    try {
      const user = await this.authService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;
