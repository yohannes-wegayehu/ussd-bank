const ussdController = require('./controllers/ussd.controller');

class USSDApp {
    constructor() {
        this.controller = ussdController;
    }

    handleRequest(req, res) {
        try {
            const { sessionId, phoneNumber, text } = req.body;
            
            // Validate required fields
            if (!sessionId || !phoneNumber) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }

            // Process USSD request
            const response = this.controller.processRequest({
                sessionId,
                phoneNumber,
                text: text || ''
            });

            return res.status(200).json(response);
        } catch (error) {
            console.error('USSD Error:', error);
            return res.status(500).json({
                response: 'END An error occurred. Please try again.'
            });
        }
    }
}

module.exports = new USSDApp();