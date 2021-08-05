const Event = require('../models/event');
const User = require('../models/user');

const bcrypt = require('bcrypt');

const initialEvents = [
    {
        title: 'Title 1',
        description: 'HTML is easy',
        featured: true,
        dates: [{
            price: 90,
            date: new Date()
        }],
        image: 'image1'
    },
    {
        title: 'Title 2',
        description: 'Events are awesome!',
        featured: false,
        dates: [{
            price: 60,
            date: new Date()
        },{
            price: 75,
            date: new Date()
        }],
        image: 'image2'
    }
]

const passwordHash = bcrypt.hash('rootpass', 10);

const initialUser = {
    "username": "root",
    "passwordHash": passwordHash
}

const nonExistingId = async () => {
    const event = new Event({ title: 'title1', description: 'willremovethissoon', date: new Date(), image: 'imagetoremove' });
    await event.save();
    await event.remove();

    return event._id.toString();
}

const eventsInDb = async () => {
    const events = await Event.find({});
    return events.map(event => event.toJSON());
}

const usersInDb = async () => {
    const users = await User.find({});
    return users.map(u => u.toJSON());
}

module.exports = {
    initialEvents, initialUser, nonExistingId, eventsInDb, usersInDb
}