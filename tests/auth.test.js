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

describe('Markers API', () => {

  let token;

  // Obtener token antes de los tests de marcadores
  beforeAll(async () => {
    const testUser = { email: 'markers@logixmap.com', password: 'password123' };

    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    token = loginRes.body.token;
  });

  describe('POST /api/markers', () => {

    it('debe crear un marcador correctamente', async () => {
      const res = await request(app)
        .post('/api/markers')
        .set('Authorization', `Bearer ${token}`)
        .send({ lat: 13.6929, lng: -89.2182, label: 'San Salvador' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.label).toBe('San Salvador');
    });

    it('debe rechazar marcador sin lat/lng', async () => {
      const res = await request(app)
        .post('/api/markers')
        .set('Authorization', `Bearer ${token}`)
        .send({ label: 'Sin coordenadas' });

      expect(res.statusCode).toBe(400);
    });

    it('debe rechazar creación sin token', async () => {
      const res = await request(app)
        .post('/api/markers')
        .send({ lat: 13.6929, lng: -89.2182 });

      expect(res.statusCode).toBe(401);
    });

  });

  describe('PUT /api/markers/:id', () => {

    let markerId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/markers')
        .set('Authorization', `Bearer ${token}`)
        .send({ lat: 13.6929, lng: -89.2182, label: 'Original' });
      markerId = res.body.id;
    });

    it('debe actualizar etiqueta del marcador', async () => {
      const res = await request(app)
        .put(`/api/markers/${markerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ label: 'Actualizado' });

      expect(res.statusCode).toBe(200);
      expect(res.body.label).toBe('Actualizado');
    });

    it('debe actualizar color del marcador', async () => {
      const res = await request(app)
        .put(`/api/markers/${markerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ color: '#10B981' });

      expect(res.statusCode).toBe(200);
      expect(res.body.color).toBe('#10B981');
    });

    it('debe retornar 404 para marcador inexistente', async () => {
      const res = await request(app)
        .put('/api/markers/id-que-no-existe')
        .set('Authorization', `Bearer ${token}`)
        .send({ label: 'Test' });

      expect(res.statusCode).toBe(404);
    });

  });

  describe('DELETE /api/markers/:id', () => {

    let markerId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/markers')
        .set('Authorization', `Bearer ${token}`)
        .send({ lat: 13.6929, lng: -89.2182, label: 'Para eliminar' });
      markerId = res.body.id;
    });

    it('debe eliminar el marcador correctamente', async () => {
      const res = await request(app)
        .delete(`/api/markers/${markerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Marcador eliminado');
    });

    it('debe retornar 404 al eliminar marcador inexistente', async () => {
      const res = await request(app)
        .delete('/api/markers/id-que-no-existe')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

  });

});