const response = require('supertest');
const server = require('./server');
const db = require('../data/dbConfig');

test('sanity', () => {
  expect(true).toBe(true)
});

describe('server.js', () => {
  beforeAll(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db('users').truncate();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('[POST] /api/register ', () => {
    it('status:422, username and password required', () => {
      return response(server).post('/api/auth/register')
        .expect(422, {message:'username and password required'})
    });

    it('status:201, registered user', async () => {
      const res = await response(server).post('/api/auth/register')
        .send({username:'Captain Marvel', password:'foobar'})

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('username');
        expect(res.body).toHaveProperty('password');
        expect(res.body).toMatchObject({username:'Captain Marvel'})
    });
  });

  describe('[POST] /api/auth/login ', () => {
    it('status:422, username and password required', async () => {
      return response(server).post('/api/auth/login')
      .expect(422, {message: 'username and password required'});
    });

    it('status:401, invalid credentials', () => {
      return response(server).post('/api/auth/login')
        .send({username:'Captain M', password:'boofar'})
        .expect(401, {message:'invalid credentials'})
    });

    it('status:200, loggin successful', async () => {
      const creds = {username:'Captain Marvel', password:'foobar'};

      await response(server).post('/api/auth/register').send(creds);
      const res = await response(server).post('/api/auth/login').send(creds);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({message: `welcome, ${creds.username}`})
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('[GET] /api/jokes', () => {
    it('status:401, token required', () => {
      return response(server).get('/api/jokes')
        .expect(401, {message:'token required'})
    });

    it('status:401, invalid token', () => {
      return response(server).get('/api/jokes')
        .set('Authorization', 'invalid-token')
        .expect(401, {message:'token invalid'});
    });

    it('status:200, responds with array of jokes', async () => {
      const creds = {username:'Spiderman',password:'foobar'};
      await response(server).post('/api/auth/register').send(creds);
      const loginToken = await response(server).post('/api/auth/login').send(creds);

      const res = await response(server).get('/api/jokes').set('Authorization', `${loginToken.body.token}`);
      
      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('joke');
    });
  });
});
