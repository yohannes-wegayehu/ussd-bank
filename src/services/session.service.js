const sessions = require('../data/sessions');

class SessionService {
    createSession(sessionId, phoneNumber) {
        const session = {
            id: sessionId,
            phoneNumber: phoneNumber,
            state: 'MAIN_MENU',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            data: {}
        };
        
        sessions[sessionId] = session;
        return session;
    }

    getSession(sessionId) {
        const session = sessions[sessionId];
        if (session) {
            // Update last activity
            session.lastActivity = new Date().toISOString();
            this.updateSession(sessionId, session);
        }
        return session;
    }

    updateSession(sessionId, sessionData) {
        sessions[sessionId] = {
            ...sessions[sessionId],
            ...sessionData,
            lastActivity: new Date().toISOString()
        };
        return sessions[sessionId];
    }

    deleteSession(sessionId) {
        delete sessions[sessionId];
        return true;
    }

    // Clean up expired sessions (optional)
    cleanupSessions(timeoutMinutes = 5) {
        const now = new Date();
        const timeout = timeoutMinutes * 60 * 1000; // Convert to milliseconds
        
        for (const [sessionId, session] of Object.entries(sessions)) {
            const lastActivity = new Date(session.lastActivity);
            if (now - lastActivity > timeout) {
                this.deleteSession(sessionId);
            }
        }
    }
}

module.exports = new SessionService();