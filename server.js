require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ussdRoutes = require('./src/routes/ussd.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/ussd', ussdRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'CBE USSD Banking Service is running',
        version: '1.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 CBE USSD Server running on port ${PORT}`);
});