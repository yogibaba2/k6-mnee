import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readTransactionData, writeToFile, writeTransactionData } from './src/utils/fileWriter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const TX_FILE_PATH = path.join(__dirname, './data/transaction_data.txt');
const JSON_FILE_PATH = path.join(__dirname, './data/transaction_data.json');
const CHECK_INTERVAL = 5000; // Check every 5 seconds

// Keep track of processed transactions
let processedTxs = [];

function initializeProcessedTxs() {
    // Read existing transactions from JSON file to avoid duplicates
    const existingData = readTransactionData(JSON_FILE_PATH);
    existingData.forEach(item => processedTxs.add(item.txHash));
}

function processTransaction(txHash) {
    try {
         if (processedTxs.some((tx) => tx.txHash == txHash)) {
            return; // Skip if already processed
        }

        const txData = {
            txHash: txHash.split(' ')[0],
            firstConfirmationTime: null,
            blockHeight: null,
            sixthConfirmationTime: null,
            timestamp: txHash.split(' ')[1],
            status: 'pending'
        };

        // writeTransactionData(txData, JSON_FILE_PATH);
        processedTxs.push(txData);
        // console.log(`Processed new transaction: ${txHash}`);
    } catch (error) {
        console.log(`Error in processing transaction: ${txHash} \n error: ${error}`);
    }
   
}

function readTransactionFile() {
    try {
        if (!fs.existsSync(TX_FILE_PATH)) {
            console.log(`Transaction file not found at ${TX_FILE_PATH}`);
            return;
        }

        const content = fs.readFileSync(TX_FILE_PATH, 'utf8');
        const transactions = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0); // Skip empty lines

        transactions.forEach(txHash => {
            processTransaction(txHash);
        });

    } catch (error) {
        console.error('Error reading transaction file:', error);
    }
}

function startMonitoring() {
    console.log('Starting transaction monitor...');
    console.log(`Watching file: ${TX_FILE_PATH}`);
    console.log(`Writing to: ${JSON_FILE_PATH}`);

    // Initialize from existing JSON file
    // initializeProcessedTxs();

    // Initial read
    readTransactionFile();

    // write to file
    writeToFile(processedTxs, JSON_FILE_PATH);

    // Set up continuous monitoring
    setInterval(() => {
        readTransactionFile();
    }, CHECK_INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nStopping transaction monitor...');
        process.exit(0);
    });
}

// Start the monitoring process
startMonitoring();
