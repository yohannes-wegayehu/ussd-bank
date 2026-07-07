const users = require('../data/users');

class BankingService {
    getUserByPhone(phoneNumber) {
        // Clean phone number (remove leading zeros or country code)
        const cleanPhone = this.cleanPhoneNumber(phoneNumber);
        return users.find(user => user.phone === cleanPhone);
    }

    getUserByAccount(accountNumber) {
        return users.find(user => user.account === accountNumber);
    }

    getUserById(userId) {
        return users.find(user => user.id === userId);
    }

    cleanPhoneNumber(phone) {
        // Remove +251, 0, or spaces
        let cleaned = phone.replace(/\s/g, '');
        if (cleaned.startsWith('+251')) {
            cleaned = '0' + cleaned.substring(4);
        }
        if (cleaned.startsWith('251')) {
            cleaned = '0' + cleaned.substring(3);
        }
        return cleaned;
    }

    validateAccount(accountNumber) {
        // Validate Ethiopian bank account number (13 digits)
        return /^\d{13}$/.test(accountNumber);
    }

    validateAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && Number.isFinite(num);
    }

    checkBalance(phoneNumber) {
        const user = this.getUserByPhone(phoneNumber);
        return user ? user.balance : null;
    }

    updateBalance(phoneNumber, amount, operation = 'debit') {
        const user = this.getUserByPhone(phoneNumber);
        if (!user) return null;

        if (operation === 'debit') {
            if (user.balance < amount) return false;
            user.balance -= amount;
        } else {
            user.balance += amount;
        }
        return user.balance;
    }
}

module.exports = new BankingService();