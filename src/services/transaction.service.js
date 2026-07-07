const transactions = require('../data/transactions');
const bankingService = require('./banking.service');
const { generateReference } = require('../utils/reference');

class TransactionService {
    processTransfer(senderPhone, recipientAccount, amount, reference) {
        try {
            // Get sender and recipient
            const sender = bankingService.getUserByPhone(senderPhone);
            const recipient = bankingService.getUserByAccount(recipientAccount);

            if (!sender) {
                return {
                    success: false,
                    message: 'Sender account not found'
                };
            }

            if (!recipient) {
                return {
                    success: false,
                    message: 'Recipient account not found'
                };
            }

            if (sender.balance < amount) {
                return {
                    success: false,
                    message: 'Insufficient balance'
                };
            }

            // Validate amount
            if (amount < 1) {
                return {
                    success: false,
                    message: 'Amount must be greater than 1 ETB'
                };
            }

            // Process debit from sender
            const newSenderBalance = bankingService.updateBalance(senderPhone, amount, 'debit');
            
            // Process credit to recipient
            bankingService.updateBalance(recipient.phone, amount, 'credit');

            // Create transaction record
            const transaction = {
                id: transactions.length + 1,
                reference: reference || generateReference(),
                sender: sender.phone,
                recipient: recipient.phone,
                recipientName: recipient.name,
                amount: amount,
                type: 'TRANSFER',
                status: 'COMPLETED',
                date: new Date().toISOString(),
                senderBalance: newSenderBalance
            };

            transactions.push(transaction);

            return {
                success: true,
                message: 'Transfer completed successfully',
                transaction: transaction,
                newBalance: newSenderBalance,
                recipientName: recipient.name,
                reference: transaction.reference
            };
        } catch (error) {
            console.error('Transaction Error:', error);
            return {
                success: false,
                message: 'Transaction failed: ' + error.message
            };
        }
    }

    getUserTransactions(phoneNumber, limit = 10) {
        const userTrans = transactions
            .filter(t => t.sender === phoneNumber || t.recipient === phoneNumber)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);

        return userTrans;
    }

    getAllTransactions() {
        return transactions;
    }

    getTransactionByReference(reference) {
        return transactions.find(t => t.reference === reference);
    }
}

module.exports = new TransactionService();