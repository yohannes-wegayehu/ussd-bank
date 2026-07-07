const sessionService = require('../services/session.service');
const bankingService = require('../services/banking.service');
const transactionService = require('../services/transaction.service');
const { generateReference } = require('../utils/reference');

class USSDController {
    processRequest(data) {
        const { sessionId, phoneNumber, text } = data;
        
        // Get or create session
        let session = sessionService.getSession(sessionId);
        if (!session) {
            session = sessionService.createSession(sessionId, phoneNumber);
        }

        // Parse USSD input
        const input = text.split('*');
        const currentLevel = input.length - 1;

        // Handle different menu levels
        switch (currentLevel) {
            case 0:
                return this.mainMenu(sessionId);
            case 1:
                return this.handleMainMenu(sessionId, input[1]);
            case 2:
                return this.handleSubMenu(sessionId, input[1], input[2]);
            case 3:
                return this.handleTransferAmount(sessionId, input[1], input[2], input[3]);
            case 4:
                return this.handleTransferConfirm(sessionId, input[1], input[2], input[3], input[4]);
            default:
                return this.invalidOption(sessionId);
        }
    }

    mainMenu(sessionId) {
        const menu = `CON Welcome to CBE Mobile Banking
        1. Transfer Money
        2. Check Balance
        3. Mini Statement
        4. Airtime Purchase
        5. Change PIN
        0. Exit`;
        
        return this.formatResponse(sessionId, menu);
    }

    handleMainMenu(sessionId, option) {
        switch (option) {
            case '1':
                return this.transferMenu(sessionId);
            case '2':
                return this.checkBalance(sessionId);
            case '3':
                return this.miniStatement(sessionId);
            case '4':
                return this.airtimePurchase(sessionId);
            case '5':
                return this.changePin(sessionId);
            case '0':
                return this.exitSession(sessionId);
            default:
                return this.invalidOption(sessionId);
        }
    }

    // TRANSFER FUNCTIONALITY
    transferMenu(sessionId) {
        const session = sessionService.getSession(sessionId);
        session.state = 'TRANSFER_INIT';
        sessionService.updateSession(sessionId, session);

        const menu = `CON Transfer Money
        Enter recipient account number:
        (e.g., 1000123456789)`;
        
        return this.formatResponse(sessionId, menu);
    }

    handleSubMenu(sessionId, mainOption, subInput) {
        const session = sessionService.getSession(sessionId);

        if (mainOption === '1') {
            // Transfer - Get Amount
            if (!session.transferData) {
                session.transferData = {};
            }
            session.transferData.recipient = subInput;
            session.state = 'TRANSFER_AMOUNT';
            sessionService.updateSession(sessionId, session);

            const menu = `CON Enter amount to transfer:
            Amount in ETB (min: 1.00)`;
            
            return this.formatResponse(sessionId, menu);
        }
        
        return this.invalidOption(sessionId);
    }

    handleTransferAmount(sessionId, mainOption, account, amount) {
        const session = sessionService.getSession(sessionId);

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 1) {
            const menu = `CON Invalid amount. Please enter a valid amount:
            Amount in ETB (min: 1.00)`;
            return this.formatResponse(sessionId, menu);
        }

        // Check if user has sufficient balance
        const user = bankingService.getUserByPhone(session.phoneNumber);
        if (!user) {
            return this.formatResponse(sessionId, 'END User not found. Please contact customer care.');
        }

        if (user.balance < amountNum) {
            const menu = `CON Insufficient balance. Your balance is ${user.balance.toFixed(2)} ETB
            Enter a lower amount:`;
            return this.formatResponse(sessionId, menu);
        }

        // Store transfer data
        session.transferData.amount = amountNum;
        session.state = 'TRANSFER_CONFIRM';
        sessionService.updateSession(sessionId, session);

        // Generate reference
        const reference = generateReference();
        session.transferData.reference = reference;

        // Get recipient details
        const recipient = bankingService.getUserByAccount(account);
        const recipientName = recipient ? recipient.name : 'Unknown Recipient';

        const menu = `CON Transfer Confirmation
        To: ${recipientName}
        Account: ${account}
        Amount: ${amountNum.toFixed(2)} ETB
        Reference: ${reference}
        
        1. Confirm
        2. Cancel`;
        
        return this.formatResponse(sessionId, menu);
    }

    handleTransferConfirm(sessionId, mainOption, account, amount, choice) {
        const session = sessionService.getSession(sessionId);

        if (choice === '1') {
            // Process transfer
            const { recipient, amount: transferAmount, reference } = session.transferData;
            
            try {
                // Process the transaction
                const transaction = transactionService.processTransfer(
                    session.phoneNumber,
                    recipient,
                    transferAmount,
                    reference
                );

                if (transaction.success) {
                    // Clear transfer data
                    session.transferData = null;
                    session.state = 'COMPLETED';
                    sessionService.updateSession(sessionId, session);

                    const menu = `END ✅ Transfer Successful!
                    Amount: ${transferAmount.toFixed(2)} ETB
                    To: ${transaction.recipientName}
                    Reference: ${reference}
                    New Balance: ${transaction.newBalance.toFixed(2)} ETB
                    
                    Thank you for using CBE Mobile Banking`;
                    
                    return this.formatResponse(sessionId, menu);
                } else {
                    const menu = `END ❌ Transfer Failed!
                    ${transaction.message}
                    Reference: ${reference}
                    
                    Please try again or contact customer care.`;
                    
                    return this.formatResponse(sessionId, menu);
                }
            } catch (error) {
                console.error('Transfer Error:', error);
                const menu = `END ❌ Transfer Failed!
                An error occurred. Please try again.
                Reference: ${reference}`;
                
                return this.formatResponse(sessionId, menu);
            }
        } else if (choice === '2') {
            // Cancel transfer
            session.transferData = null;
            session.state = 'CANCELLED';
            sessionService.updateSession(sessionId, session);

            const menu = `END Transfer Cancelled.
            You have been returned to the main menu.
            Dial *889# to start again.`;
            
            return this.formatResponse(sessionId, menu);
        } else {
            const menu = `CON Invalid choice.
            Please select:
            1. Confirm
            2. Cancel`;
            
            return this.formatResponse(sessionId, menu);
        }
    }

    // Other banking functions
    checkBalance(sessionId) {
        const session = sessionService.getSession(sessionId);
        const user = bankingService.getUserByPhone(session.phoneNumber);
        
        if (!user) {
            return this.formatResponse(sessionId, 'END User not found. Please contact customer care.');
        }

        const menu = `END Your balance is: ${user.balance.toFixed(2)} ETB
        Thank you for using CBE Mobile Banking`;
        
        return this.formatResponse(sessionId, menu);
    }

    miniStatement(sessionId) {
        const session = sessionService.getSession(sessionId);
        const transactions = transactionService.getUserTransactions(session.phoneNumber, 5);
        
        if (!transactions || transactions.length === 0) {
            return this.formatResponse(sessionId, 'END No transactions found.');
        }

        let statement = 'END Last 5 Transactions:\n';
        transactions.forEach((t, index) => {
            statement += `${index + 1}. ${t.type}: ${t.amount.toFixed(2)} ETB\n`;
            statement += `   ${t.date}\n`;
        });
        statement += '\nThank you for using CBE Mobile Banking';
        
        return this.formatResponse(sessionId, statement);
    }

    airtimePurchase(sessionId) {
        const menu = `CON Airtime Purchase
        Enter phone number:`;
        return this.formatResponse(sessionId, menu);
    }

    changePin(sessionId) {
        const menu = `CON Change PIN
        Enter current PIN:`;
        return this.formatResponse(sessionId, menu);
    }

    exitSession(sessionId) {
        sessionService.deleteSession(sessionId);
        return this.formatResponse(sessionId, 'END Thank you for using CBE Mobile Banking. Goodbye!');
    }

    invalidOption(sessionId) {
        const menu = `CON Invalid option. Please try again.
        ${this.mainMenu(sessionId).response}`;
        return this.formatResponse(sessionId, menu);
    }

    formatResponse(sessionId, message) {
        return {
            sessionId,
            response: message
        };
    }
}

module.exports = new USSDController();