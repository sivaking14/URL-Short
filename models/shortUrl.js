const mongoose = require('mongoose');
const shortId = require('shortid');

const shortUrlSchema = new mongoose.Schema({
    full: {
        type: String,
        required: true
    },
    short: {
        type: String,
        required: true,
        default: shortId.generate // This will be a unique short code
    },
    clicks: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    qrCode: {
        type: String, // Stores the QR code as a base64 string
        required: false
    }
    
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);
