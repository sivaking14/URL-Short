const mongoose = require('mongoose');
const shortid = require('shortid');

const urlSchema = new mongoose.Schema({
    fullUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true,
        default: shortid.generate // Generates a unique ID for each short URL
    },
    clicks: {
        type: Number,
        required: true,
        default: 0
    },
    expirationTime: {
        type: Date,
        required: false // Add expiration logic if needed
    },
    qrCode: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Url', urlSchema);
