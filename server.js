const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const QRCode = require('qrcode'); // Import QRCode module
const app = express();

mongoose.connect('mongodb://localhost/urlShortner', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.get('/clear', async (req, res) => {
    await ShortUrl.deleteMany({});
    res.send('All short URLs have been deleted.');
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Render homepage with existing active short URLs (excluding expired ones)
app.get('/', async (req, res) => {
    const now = new Date();

    // Find URLs that are not expired
    const activeShortUrls = await ShortUrl.find({ expiresAt: { $gt: now } });

    // Calculate remaining time for each active URL
    const shortUrlsWithRemainingTime = activeShortUrls.map(shortUrl => {
        const remainingTime = Math.max(0, shortUrl.expiresAt - now); // in milliseconds
        return {
            ...shortUrl._doc,
            remainingTime: Math.ceil(remainingTime / 1000 / 60) // convert to minutes
        };
    });

    res.render('index', { shortUrls: shortUrlsWithRemainingTime });
});

// Handle form submission for creating a new short URL with expiration and QR code
app.post('/shortUrls', async (req, res) => {
    const { fullUrl, timeFrame } = req.body;
    let expirationMinutes;

    // Determine expiration time based on selected time frame
    switch (timeFrame) {
        case '1':
            expirationMinutes = 1;
            break;
        case '5':
            expirationMinutes = 5;
            break;
        case '15':
            expirationMinutes = 15;
            break;
        case '30':
            expirationMinutes = 30;
            break;
        case '60':
            expirationMinutes = 60;
            break;
        default:
            expirationMinutes = 1; // Default to 1 minute if none selected
    }

    // Check if the URL already has a short version, regardless of expiration
    let shortUrl = await ShortUrl.findOne({ full: fullUrl });
    if (shortUrl && shortUrl.expiresAt > new Date()) {
        // If the active short URL already exists, redirect to the homepage
        return res.redirect('/');
    }

    // Set expiration date for the new short URL
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expirationMinutes * 60000);

    // Create or update the short URL with expiration time
    shortUrl = new ShortUrl({
        full: fullUrl,
        expiresAt: expiresAt
    });

    // Generate the QR code for the short URL
    const shortUrlPath = `http://localhost:5000/${shortUrl.short}`;
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrlPath);
    shortUrl.qrCode = qrCodeDataUrl; // Store QR code in the model

    await shortUrl.save();
    res.redirect('/');
});

// Handle redirection to full URL from short URL
app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });

    // Check if the short URL is found
    if (!shortUrl) return res.sendStatus(404);

    const now = new Date();
    if (now > shortUrl.expiresAt) {
        // Mark the URL as expired instead of deleting it
        shortUrl.isExpired = true;
        await shortUrl.save();
        return res.status(410).send('This link has expired.');
    }

    // Increment click count and redirect to the full URL
    shortUrl.clicks++;
    await shortUrl.save();
    res.redirect(shortUrl.full);
});

// New route to view expired URLs
app.get('/expiredUrls', async (req, res) => {
    const now = new Date();

    // Find URLs that are expired
    const expiredUrls = await ShortUrl.find({ expiresAt: { $lt: now } });

    res.render('expiredUrls', { expiredUrls }); // Render expired URLs page
});

// Start the server
app.listen(process.env.PORT || 5000, () => {
    console.log('Server is running on port 5000');
});
