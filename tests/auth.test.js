const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {

  const testUser = {
    email: 'test@logixmap.com',
    password: 'password123'
  };

  describe('POST /api/auth/register', () => {

    it('debe registrar un usuario correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Usuario registrado correctamente');
    });

    it('debe rechazar email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      expect(res.statusCode).toBe(409);
    });

    it('debe rechazar contraseña menor a 8 caracteres', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'otro@test.com', password: '123' });
      expect(res.statusCode).toBe(400);
    });

    it('debe rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'noesuncorreo', password: 'password123' });
      expect(res.statusCode).toBe(400);
    });

    it('debe rechazar body vacío', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.statusCode).toBe(400);
    });

  });

  describe('POST /api/auth/login', () => {

    it('debe retornar token con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('debe rechazar contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
    });

    it('debe rechazar usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com', password: 'password123' });
      expect(res.statusCode).toBe(401);
    });

  });

  describe('GET /api/markers (ruta protegida)', () => {

    it('debe rechazar acceso sin token', async () => {
      const res = await request(app)
        .get('/api/markers');
      expect(res.statusCode).toBe(401);
    });

    it('debe rechazar token inválido', async () => {
      const res = await request(app)
        .get('/api/markers')
        .set('Authorization', 'Bearer tokenfalso123');
      expect(res.statusCode).toBe(403);
    });

    it('debe permitir acceso con token válido', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/markers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

  });

});