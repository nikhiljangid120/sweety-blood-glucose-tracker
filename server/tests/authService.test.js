const bcrypt = require('bcryptjs');
const AuthService = require('../src/services/authService');

describe('AuthService', () => {
  let mockUserRepo;
  let authService;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    authService = new AuthService(mockUserRepo);
  });

  test('hashes password using bcrypt and never passes plain text to repository', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockImplementation(async (userData) => ({
      id: 1,
      ...userData,
    }));

    const result = await authService.register({
      name: 'Nikhil Patel',
      email: 'nikhil@example.com',
      password: 'mySecretPassword123',
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('nikhil@example.com');

    // Verify repository was called with hashed password
    const createCallArg = mockUserRepo.create.mock.calls[0][0];
    expect(createCallArg.password).not.toBe('mySecretPassword123');
    expect(createCallArg.password.startsWith('$2')).toBe(true);

    const isMatch = await bcrypt.compare('mySecretPassword123', createCallArg.password);
    expect(isMatch).toBe(true);
  });

  test('rejects duplicate email during registration', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: 1, email: 'exists@example.com' });

    await expect(
      authService.register({
        name: 'Duplicate',
        email: 'exists@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('A user with this email already exists.');
  });

  test('authenticates valid credentials and returns JWT', async () => {
    const hashedPassword = await bcrypt.hash('validPassword123', 10);
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 5,
      name: 'Valid User',
      email: 'valid@example.com',
      password: hashedPassword,
      role: 'patient',
    });

    const result = await authService.login({
      email: 'valid@example.com',
      password: 'validPassword123',
    });

    expect(result.token).toBeDefined();
    expect(result.user.id).toBe(5);
  });

  test('rejects invalid password', async () => {
    const hashedPassword = await bcrypt.hash('correctPassword', 10);
    mockUserRepo.findByEmail.mockResolvedValue({
      id: 5,
      name: 'Valid User',
      email: 'valid@example.com',
      password: hashedPassword,
    });

    await expect(
      authService.login({
        email: 'valid@example.com',
        password: 'wrongPassword',
      })
    ).rejects.toThrow('Invalid email or password.');
  });
});
