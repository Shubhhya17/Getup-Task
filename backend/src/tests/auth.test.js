process.env.JWT_SECRET = 'test_secret';
process.env.AI_API_KEY = ''; // Force mock fallback in all tests
process.env.AI_PROVIDER = 'mock';
process.env.UPLOAD_DIR = '/tmp/test-uploads';

const request = require('supertest');
const app = require('../../server');
const { connectTestDB, clearDB, closeTestDB } = require('../testDb');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Auth — Register', () => {
  it('registers a new customer successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.password).toBeUndefined(); // never expose password
  });

  it('registers with a specific role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Agent User',
      email: 'agent@example.com',
      password: 'password123',
      role: 'agent',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('agent');
  });

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'dup@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'dup@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects password shorter than 6 chars', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short',
      email: 'short@example.com',
      password: '123',
    });

    expect(res.status).toBe(422);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'noname@example.com',
    });

    expect(res.status).toBe(422);
  });
});

describe('Auth — Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'correctpass',
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'correctpass',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password',
    });

    expect(res.status).toBe(401);
  });

  it('rejects malformed email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notanemail',
      password: 'password',
    });

    expect(res.status).toBe(422);
  });
});

describe('Auth — Protected Routes', () => {
  it('returns 401 for /api/auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user info with valid token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Me Test',
      email: 'me@example.com',
      password: 'password123',
    });

    const { token } = registerRes.body;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('returns 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });
});
