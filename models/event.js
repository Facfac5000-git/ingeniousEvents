const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 6
    },
    description: {
        type: String,
        required: true,
        minlength: 10
    },
    dates: [{
        date: {
            type: Date,
            required: true,    
        },
        price: {
            type: Number,
            min: 0
        }
    }],
    featured: Boolean,
    image: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

eventSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
});

module.exports = mongoose.model('Event', eventSchema);