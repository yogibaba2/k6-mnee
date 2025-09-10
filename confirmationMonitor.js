import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const JSON_FILE_PATH = path.join(__dirname, './data/transaction_data.json');
const BATCH_SIZE = 10;
const CHECK_INTERVAL = 10000; // Check every 30 seconds
const WOC_API_BASE = 'https://api.whatsonchain.com/v1/bsv/main';

// Helper function to make HTTP requests
function makeHttpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        // console.log('Response data:', data);
                        resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        reject(new Error('Failed to parse response'));
                    }
                } else {
                    reject(new Error(`HTTP Status ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => reject(error));
        
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function checkTransactionConfirmations(txBatch) {
    const options = {
        hostname: 'api.whatsonchain.com',
        path: '/v1/bsv/main/txs/status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        // console.log(`Checking confirmations for batch: ${txBatch}`);
        const response = await makeHttpRequest(options, { txids: txBatch });
        // console.log('Response data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error checking confirmations:', error);
        return null;
    }
}

async function checkBlockForTransaction(blockHeight, txHash) {
    const options = {
        hostname: 'api.whatsonchain.com',
        path: `/v1/bsv/main/block/height/${blockHeight}`,
        method: 'GET'
    };

    try {
        const response = await makeHttpRequest(options);
        if (response.data && response.data.tx) {
            // if (response.data.tx.includes(txHash)) {
                return response.data.time;
            // }
        }
        return false;
    } catch (error) {
        console.error(`Error checking block ${blockHeight}:`, error.message);
        return false;
    }
}

async function processTransactions() {
    try {
        // Read current transaction data
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        let transactions = JSON.parse(fileContent);
        let modified = false;

        // Process transactions in batches
        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
            console.log(`processing batch from ${i} to ${i + BATCH_SIZE}`)
            const batch = transactions.slice(i, i + BATCH_SIZE);
            const batchTxIds = batch
                .filter(tx => 
                    (tx.firstConfirmationTime == null || tx.sixthConfirmationTime == null)
                )
                .map(tx => tx.txHash);
            
            let confirmations = null;
            // Check confirmations for the batch
            if (batchTxIds.length == 0) {
                console.log('No transactions in batch to check confirmations');
            } else
            {
                console.log(`Checking confirmations for batch of: ${batchTxIds.length}`);
                confirmations = await checkTransactionConfirmations(batchTxIds);
                confirmations = confirmations.filter(conf => conf && conf.confirmations);
                if (!confirmations || confirmations.length == 0) {
                    console.log('No confirmations found in batch');
                } else {
                    for (const conf of confirmations) {
                        const tx = batch.find(tx => tx.txHash === conf.txid);
                        if (tx && !tx.firstConfirmationTime && (conf.confirmations >= 1 && conf.confirmations < 6)) {
                            // tx.firstConfirmationTime = conf.blocktime;
                            tx.firstConfirmationTime = Date.now() - tx.timestamp; ;
                            tx.blockHeight = conf.blockheight;
                            modified = true;
                            console.log(`First confirmation for ${tx.txHash} at block ${tx.blockHeight} and time ${tx.firstConfirmationTime}`);
                        
                        }
                        if (tx && (conf.confirmations >= 6)) {
                            // tx.firstConfirmationTime = conf.blocktime;
                            tx.sixthConfirmationTime = Date.now() - tx.timestamp; 
                            modified = true;
                            console.log(`Sixth confirmation for ${tx.txHash} at time ${tx.sixthConfirmationTime}`);
                        
                        }
                    }
                }
                
            } 
            
            
            //check for sixt confirmation
            // const batchForSixth = batch.filter(tx => tx.firstConfirmationTime && tx.blockHeight && !tx.sixthConfirmationTime);
            // if (batchForSixth.length == 0) {
            //     console.log('No transactions in batch to check sixth confirmation');
            // } else
            // {
            //     for (const stx of batchForSixth) {
            //         const tx = batch.find(tx => tx.txHash === stx.txHash);
            //         const sixthBlockHeight = stx.blockHeight + 5;
            //         const sixthTime = await checkBlockForTransaction(sixthBlockHeight, stx.txHash);

            //         if (sixthTime) {
            //                 tx.sixthConfirmationTime = sixthTime;
            //                 modified = true;
            //                 console.log(`Sixth confirmation for ${tx.txHash} at and time ${tx.sixthConfirmationTime}`);
            //             }

            //     }
            // }

            // Update transaction in the main array
            for (let j = 0; j < batch.length; j++) {
                const tx = batch[j];
                transactions[i + j] = tx;
            }

            // Add delay between batches to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Write updated data back to file if modified
        if (modified) {
            console.log(`Writing updated transaction data to file...`);
            fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(transactions, null, 2));
            console.log('Transaction data updated');
        }

    } catch (error) {
        console.error('Error processing transactions:', error);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startMonitoring() {
    console.log('Starting confirmation monitor...');
    console.log(`Monitoring file: ${JSON_FILE_PATH}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`Check interval: ${CHECK_INTERVAL}ms`);

    // Flag to control the monitoring loop
    let isRunning = true;

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nStopping confirmation monitor...');
        isRunning = false;
    });

    // Continuous monitoring loop
    while (isRunning) {
        try {
            console.log('Processing transactions...');
            await processTransactions();
            console.log(`Processing complete. Waiting ${CHECK_INTERVAL}ms before next check...`);
            await sleep(CHECK_INTERVAL);
        } catch (error) {
            console.error('Error in processing cycle:', error);
            // Still wait before retrying on error
            await sleep(CHECK_INTERVAL);
        }
    }

    process.exit(0);
}

// Start the monitoring process
startMonitoring().catch(error => {
    console.error('Error in monitoring process:', error);
    process.exit(1);
});
