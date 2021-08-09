const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const bcrypt = require('bcrypt')

const Event = require('../models/event');
const User = require('../models/user');

jest.setTimeout(10000);

test('events are returned as json', async () => {

    await api
        .get('/api/events')
        .expect(200)
        .expect('Content-Type', /application\/json/)
});


describe('when there is initially some events saved', () => {
    beforeEach(async () => {
    
        await Event.deleteMany({});
    
        const eventObjects = helper.initialEvents
            .map(event => new Event(event));
        const promiseArray = eventObjects.map(event => event.save())
        await Promise.all(promiseArray)
    });

    test('events are returned as json', async () => {
        await api
            .get('/api/events')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    });
  
    test('all events are returned', async () => {
        const response = await api.get('/api/events');
  
        expect(response.body).toHaveLength(helper.initialEvents.length);
    });
  
    test('a specific event is within the returned events', async () => {
        const response = await api.get('/api/events');
  
        const descriptions = response.body.map(r => r.description);
  
        expect(descriptions).toContain(
            'Events are awesome!'
        );
    });
});
  
describe('viewing a specific event', () => {
    test('succeeds with a valid id', async () => {
        const eventsAtStart = await helper.eventsInDb();
  
        const eventToView = eventsAtStart[0];
  
        const resultEvent = await api
            .get(`/api/events/${eventToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/);
        
        const processedEventToView = JSON.parse(JSON.stringify(eventToView));
  
        expect(resultEvent.body).toEqual(processedEventToView);
    });
  
    test('fails with statuscode 404 if event does not exist', async () => {
        const validNonexistingId = await helper.nonExistingId();
  
        await api
            .get(`/api/events/${validNonexistingId}`)
            .expect(404);
    });
  
    test('fails with statuscode 400 id is invalid', async () => {
        const invalidId = '5a3d5da59070081a82a3445';
  
        await api
            .get(`/api/events/${invalidId}`)
            .expect(400);
    });
});
  
describe('addition of a new event', () => {
    beforeEach(async () => {
    
        await User.deleteMany({});
    
        const passwordHash = await bcrypt.hash('sekretpass', 10);
        const user = new User({ username: 'root', passwordHash });
        await user.save();
    });

    test('succeeds with valid data', async () => {
        const newEvent = {
            title: 'Valid Title',
            description: 'Valid Description',
            featured: true,
            dates: "[{\"date\": \"2021-08-04T11:00:00\",\"price\": 0},{\"date\": \"2021-08-02T11:00:00\",\"price\": 0}]",
            image: 'valid_image.png'
        }
    
        var token = null;

        const response = await api
            .post('/api/login')
            .set({'Content-Type': 'application/json'})
            .send({"username": "root", "password": "sekretpass"});

        token = `bearer ${response.body.token}`;
        
        await api
            .post('/api/events')
            .send(newEvent)
            .set({'Content-Type': 'application/json', 'Authorization': token})
            .expect(200)
            .expect('Content-Type', /json/);
    
        const eventsAtEnd = await helper.eventsInDb();
        expect(eventsAtEnd).toHaveLength(helper.initialEvents.length + 1);
    
        const descriptions = eventsAtEnd.map(n => n.description);
        expect(descriptions).toContain(
            'Valid Description'
        );
    });
  
    test('fails with status code 400 if data invalid', async () => {
        const newInvalidEvent = {
            featured: true,
            image: "valid_image.png"
        }
       
        const eventsAtStart = await helper.eventsInDb()

        var token = null;

        const response = await api
            .post('/api/login')
            .set({'Content-Type': 'application/json'})
            .send({"username": "root", "password": "sekretpass"});

        token = `bearer ${response.body.token}`;

        await api
            .post('/api/events')
            .send(newInvalidEvent)
            .set({'Content-Type': 'application/json', 'Authorization': token})
            .expect(400);

        const eventsAtEnd = await helper.eventsInDb();
  
        expect(eventsAtEnd).toHaveLength(eventsAtStart.length);
    });
});
  
describe('deletion of a event', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const eventsAtStart = await helper.eventsInDb()
        const eventToDelete = eventsAtStart[0]

        await api
            .delete(`/api/events/${eventToDelete.id}`)
            .expect(204);
  
        const eventsAtEnd = await helper.eventsInDb();


        expect(eventsAtEnd).toHaveLength(
            eventsAtStart.length - 1
        );
  
        const descriptions = eventsAtEnd.map(r => r.description);
  
        expect(descriptions).not.toContain(eventToDelete.description);
    });
});
  

afterAll( async () => {
    await mongoose.connection.close();
});