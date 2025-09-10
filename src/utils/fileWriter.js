import fs from 'fs';
import path from 'path';


export function writeTransactionData(txData, filePath) {
    let existingData = [];
    
    try {
        // Try to read existing file if it exists
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(fileContent);
        } else {
            console.log('Creating new transaction data file');
        }

        // Add new transaction data
        existingData.push({
            txHash: txData.txHash,
            firstConfirmationTime: txData.firstConfirmationTime,
            blockHeight: txData.blockHeight,
            sixthConfirmationTime: txData.sixthConfirmationTime,
            timestamp: Date.now()
        });

        // Write updated data back to file
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
        console.log(`Transaction data written to ${filePath}`);
        
    } catch (error) {
        console.error('Error handling transaction data file:', error);
    }
}

export function appendTransactionData(txnData, tnx) {
     txnData.push({
            txHash: txData.txHash,
            firstConfirmationTime: txData.firstConfirmationTime,
            blockHeight: txData.blockHeight,
            sixthConfirmationTime: txData.sixthConfirmationTime,
            timestamp: Date.now()
        });
        return txnData;
}

export function readTransactionData(filePath) {
    
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        }
        return [];
    } catch (error) {
        console.error('Error reading transaction data file:', error);
        return [];
    }
}