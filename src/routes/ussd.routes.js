const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussd.controller');
router.post('/callback', (req, res) => {
    try {
        const { sessionId, phoneNumber, text } = req.body;
        console.log(`📱 USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}, Text: ${text}`);

        // Process USSD request
        const response = ussdController.processRequest({
            sessionId,
            phoneNumber,
            text: text || ''
        });

        return res.status(200).send(response.response);
    } catch (error) {
        console.error('USSD Route Error:', error);
        return res.status(500).send('END An error occurred. Please try again.');
    }
});

// For testing with JSON responses
router.post('/json', (req, res) => {
    try {
        const { sessionId, phoneNumber, text } = req.body;
        
        const response = ussdController.processRequest({
            sessionId,
            phoneNumber,
            text: text || ''
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error('USSD JSON Error:', error);
        return res.status(500).json({
            response: 'END An error occurred. Please try again.'
        });
    }
});

module.exports = router;
