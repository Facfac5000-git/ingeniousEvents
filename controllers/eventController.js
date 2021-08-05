const eventsRouter = require('express').Router()
const Event = require('../models/event');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const getTokenFrom = request => {
    const authorization = request.get('authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7);
    }
    return null;
}

eventsRouter.get('/', async (request, response) => { 
    const events = await Event.find({})
        .populate('user', { username: 1, name: 1 })
    response.json(events.map(event => event.toJSON()))
});

eventsRouter.post('/', async (request, response, next) => {
    const body = request.body;
    const token = getTokenFrom(request);
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!token || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid' });
    }

    const user = await User.findById(decodedToken.id);

    let orderedDates;
    if(body.dates){
        orderedDates = JSON.parse(body.dates);
        orderedDates.sort( (a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });    
    }

    const event = new Event({
        title: body.title,
        description: body.description,
        featured: body.featured || false,
        dates: orderedDates || '',
        image: body.image || '',
        user: user._id
    });
  
    const savedEvent = await event.save();
    user.events = user.events.concat(savedEvent._id);
    await user.save();

    response.json(savedEvent);
});

eventsRouter.get('/:id', async (request, response, next) => {
    const event = await Event.findById(request.params.id);
    if (event) {
        response.json(event);
    } else {
        response.status(404).end();
    }
});

eventsRouter.delete('/:id', async (request, response, next) => {
    await Event.findByIdAndRemove(request.params.id);
    response.status(204).end();
});
  
eventsRouter.put('/:id', (request, response, next) => {
    const body = request.body;
  
    orderedDates = JSON.parse(body.dates);
    orderedDates.sort( (a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const event = {
        title: body.title,
        description: body.description,
        featured: body.featured || false,
        dates: orderedDates,
        image: body.image || '',
    }
  
    Event.findByIdAndUpdate(request.params.id, event, { new: true })
        .then(updatedEvent => {
            response.json(updatedEvent.toJSON());
        })
        .catch(error => next(error));
});

eventsRouter.get('/:id/share', async (request, response, next) => {
    const event = await Event.findById(request.params.id);
    if (event) {
        const result = {message: `Iré al ${event.title} @ ${event.dates[0].date} - link`};
        response.json(result);
    } else {
        response.status(404).end();
    }
});
  
module.exports = eventsRouter;