function generateReference() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    return `CBE-TRF-${year}${month}${day}-${random}`;
}

function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TX${timestamp}${random}`;
}

module.exports = {
    generateReference,
    generateTransactionId
};