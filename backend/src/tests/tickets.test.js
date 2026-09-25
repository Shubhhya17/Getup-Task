process.env.JWT_SECRET = 'test_secret';
process.env.AI_API_KEY = '';
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const registerAndLogin = async (role = 'customer', suffix = '') => {
  const email = `${role}${suffix}@test.com`;
  const registerRes = await request(app).post('/api/auth/register').send({
    name: `${role} User`,
    email,
    password: 'password123',
    role,
  });
  return { token: registerRes.body.token, user: registerRes.body.user };
};

const createTicket = async (token, overrides = {}) => {
  return request(app)
    .post('/api/tickets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test ticket title',
      description: 'Test ticket description with enough detail',
      ...overrides,
    });
};

// ── Ticket Creation ───────────────────────────────────────────────────────────

describe('Ticket Creation', () => {
  it('customer can create a ticket', async () => {
    const { token } = await registerAndLogin('customer', '1');
    const res = await createTicket(token);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test ticket title');
    expect(res.body.data.status).toBe('Open');
  });

  it('ticket includes AI suggestion with fallback=true when no key set', async () => {
    const { token } = await registerAndLogin('customer', '2');
    const res = await createTicket(token);

    expect(res.status).toBe(201);
    expect(res.body.data.aiSuggestion).toBeDefined();
    expect(res.body.data.aiSuggestion.fallback).toBe(true);
    expect(res.body.data.aiSuggestion.category).toBeDefined();
    expect(res.body.data.aiSuggestion.priority).toBeDefined();
    expect(res.body.data.aiSuggestion.summary).toBeDefined();
    expect(res.body.data.aiSuggestion.draftReply).toBeDefined();
  });

  it('AI suggestion does NOT overwrite customer-chosen category/priority', async () => {
    const { token } = await registerAndLogin('customer', '3');
    const res = await createTicket(token, {
      category: 'Billing',
      priority: 'High',
    });

    expect(res.status).toBe(201);
    // Human-chosen fields stay as-is
    expect(res.body.data.category).toBe('Billing');
    expect(res.body.data.priority).toBe('High');
    // AI suggestion is stored separately
    expect(res.body.data.aiSuggestion).toBeDefined();
  });

  it('rejects ticket creation without title', async () => {
    const { token } = await registerAndLogin('customer', '4');
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title here' });

    expect(res.status).toBe(422);
  });

  it('unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/tickets').send({
      title: 'No auth',
      description: 'Should fail',
    });

    expect(res.status).toBe(401);
  });
});

// ── Role-Based Access ─────────────────────────────────────────────────────────

describe('Role-Based Access Control', () => {
  it('customer cannot see another customer ticket', async () => {
    const { token: token1 } = await registerAndLogin('customer', 'a');
    const { token: token2 } = await registerAndLogin('customer', 'b');

    // Customer A creates a ticket
    const createRes = await createTicket(token1);
    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.data._id;

    // Customer B tries to fetch it
    const fetchRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(fetchRes.status).toBe(404); // Looks like not found, not leaking existence
  });

  it('agent cannot see tickets not assigned to them', async () => {
    const { token: customerToken } = await registerAndLogin('customer', 'c');
    const { token: agentToken } = await registerAndLogin('agent', 'd');

    // Customer creates unassigned ticket
    const createRes = await createTicket(customerToken);
    const ticketId = createRes.body.data._id;

    // Agent tries to fetch unassigned ticket
    const fetchRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(fetchRes.status).toBe(404);
  });

  it('admin can see all tickets', async () => {
    const { token: customerToken } = await registerAndLogin('customer', 'e');
    const { token: adminToken } = await registerAndLogin('admin', 'f');

    await createTicket(customerToken);

    const listRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  it('non-admin cannot assign tickets', async () => {
    const { token: customerToken } = await registerAndLogin('customer', 'g');
    const { token: agentToken } = await registerAndLogin('agent', 'h');

    const createRes = await createTicket(customerToken);
    const ticketId = createRes.body.data._id;

    const assignRes = await request(app)
      .patch(`/api/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ agentId: null });

    expect(assignRes.status).toBe(403);
  });

  it('customer cannot access dashboard stats', async () => {
    const { token } = await registerAndLogin('customer', 'i');
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ── Status Workflow ───────────────────────────────────────────────────────────

describe('Status Workflow Validation', () => {
  it('enforces Open -> In Progress transition (not Open -> Resolved)', async () => {
    const { token: customerToken } = await registerAndLogin('customer', 'j');
    const { token: adminToken } = await registerAndLogin('admin', 'k');

    const createRes = await createTicket(customerToken);
    const ticketId = createRes.body.data._id;

    // Skip directly to Resolved — should fail
    const skipRes = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Resolved' });

    expect(skipRes.status).toBe(400);
    expect(skipRes.body.message).toMatch(/Cannot transition/);
  });

  it('allows valid Open -> In Progress transition', async () => {
    const { token: customerToken } = await registerAndLogin('customer', 'l');
    const { token: adminToken } = await registerAndLogin('admin', 'm');

    const createRes = await createTicket(customerToken);
    const ticketId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('In Progress');
  });
});

// ── Internal Notes ────────────────────────────────────────────────────────────

describe('Internal Notes — Customer Filtering', () => {
  it('customer cannot see internal comments in API response', async () => {
    const { token: customerToken, user: customer } = await registerAndLogin('customer', 'n');
    const { token: adminToken } = await registerAndLogin('admin', 'o');

    const createRes = await createTicket(customerToken);
    const ticketId = createRes.body.data._id;

    // Admin adds internal note
    await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ body: 'This is a secret internal note', isInternal: true });

    // Customer fetches the ticket — internal note must be stripped
    const fetchRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(fetchRes.status).toBe(200);
    const internalComments = fetchRes.body.data.comments.filter((c) => c.isInternal);
    expect(internalComments.length).toBe(0);
  });

  it('customer cannot post internal notes', async () => {
    const { token: customerToken } = await registerAndLogin('customer', 'p');
    const { token: adminToken } = await registerAndLogin('admin', 'q');

    const createRes = await createTicket(customerToken);
    const ticketId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ body: 'Trying to be sneaky', isInternal: true });

    expect(res.status).toBe(403);
  });
});
