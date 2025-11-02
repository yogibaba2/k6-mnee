import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const JSON_FILE_PATH = path.join(__dirname, "../perf reports/500VU_250k_TSX_29_OCT_25/transaction_data.json");
const BATCH_SIZE = 20;
const CHECK_INTERVAL = 10000; // Check every 30 seconds
const WOC_API_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
const WOC_RATE_LIMIT = 5;
let blockList = [];

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
        console.log(`Checking confirmations for batch: ${txBatch}`);
        const response = await makeHttpRequest(options, { txids: txBatch });
        // console.log('Response data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error checking confirmations:', error);
        return null;
    }
}

async function fetchBlockDetails(blockHeight) {

    const options = {
        hostname: 'api.whatsonchain.com',
        path: `/v1/bsv/main/block/height/${blockHeight}`,
        method: 'GET'
    };

    try {
        await sleep(100)
        const response = await makeHttpRequest(options);
        if (response.data && response.data.tx) {
            // if (response.data.tx.includes(txHash)) {
                return response.data;
            // }
        }
        return false;
    } catch (error) {
        console.error(`Error checking block ${blockHeight}:`, error.message);
        return false;
    }
}

async function getAllTxForBlock(pageUris) {

    let txsList = [];
    for(const pageUri of pageUris){
        try {
            const options = {
                hostname: 'api.whatsonchain.com',
                path: `/v1/bsv/main${pageUri}`,
                method: 'GET'
            };
            await sleep(100)
            const response = await makeHttpRequest(options);
            console.log(`Fetched ${response.data.length} transactions from page ${pageUri}`);
            if (response.data && response.data.length > 0) {
                txsList = txsList.concat(response.data);
            }
        } catch (error) {
            console.error(`Error fetching transactions for page ${pageUri}:`, error.message);
            return [];
        }
    }
    return txsList;
}

async function processTransactions() {
    try {
        // Read current transaction data
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        let transactions = JSON.parse(fileContent);
        console.log(`Loaded ${transactions.length} transactions from file.`);

        console.log('started processing transactions for confirmations...');
        

        transactions.forEach(tx => {
            for(let block of blockList){
                if(block.txs.includes(tx.txHash)){
                    tx.blockHeight = block.height;
                    tx.firstConfirmationTime =Math.abs(Math.round(block.time - (tx.timestamp/1000)));
                    console.log(`Transaction ${tx.txHash} found in block ${block.height} with firstConfirmationTime after ${tx.firstConfirmationTime} seconds.`);
                    break;
                }
            }
            blockList.find(block => {
                if(block.height === (tx.blockHeight + 5)){
                    tx.sixthConfirmationTime = Math.abs(Math.round(block.time - (tx.timestamp/1000)));
                    console.log(`Transaction ${tx.txHash} sixth confirmation time after ${tx.sixthConfirmationTime} seconds.`);
                    return true;
                }
            });
            if(tx.firstConfirmationTime && tx.sixthConfirmationTime){
                tx.status = 'confirmed';
            }
        });
       
        // Write updated data back to file if modified
        console.log(`Writing updated transaction data to file...`);
        fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(transactions, null, 2));
        console.log('Transaction data updated');
       
    } catch (error) {
        console.error('Error processing transactions:', error);
    }
}

async function prepareBlockDetails() {
    try {
        // Read current transaction data
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        let transactions = JSON.parse(fileContent);
        
        //get first and last transaction
        const boundaryTxs = [transactions[0].txHash, transactions[transactions.length - 1].txHash];
       
        //check transacition block heights
        const confirmations = await checkTransactionConfirmations(boundaryTxs);


        const firstblock = confirmations.find(conf => conf.txid === boundaryTxs[0]).blockheight;
        const lastblock = confirmations.find(conf => conf.txid === boundaryTxs[1]).blockheight;

        //populate block list   
        for (let height = firstblock; height <= lastblock + 5 ; height++) {
            let blockDetails = await fetchBlockDetails(height);
            let block = {};
           
            if (blockDetails) {
                console.log(`Fetched details for block ${height}`);
                block.height = blockDetails.height;
                block.time = blockDetails.time;
                block.num_tx = blockDetails.num_tx;
                block.txs = blockDetails.tx;

                if(blockDetails.pages && blockDetails.pages.uri && blockDetails.pages.uri.length > 0){
                    console.log(`Block ${height} has ${blockDetails.pages.uri.length} pages`);
                    console.log(`Fetching additional transactions for block ${height}...`);
                    let txs_2 = await getAllTxForBlock(blockDetails.pages.uri);
                    block.txs = block.txs.concat(txs_2);
                }

                blockList.push(block);
                console.log(`Block -- ${height} with ${block.txs.length} transactions added to blockList`);

            } else {
                console.log(`No details found for block ${height}`);
            } 
        }



    } catch (error) {
        console.error('Error preparing block details:', error);
    }
}


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startProcessing() {
    console.log('Starting confirmation fetching process...');
    console.log(`checking file: ${JSON_FILE_PATH}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`Check interval: ${CHECK_INTERVAL}ms`);

    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nStopping confirmation monitor...');
        process.exit(0);
    });


    try {
        console.log('Preparing block details...');
        await prepareBlockDetails();
        console.log('Block details prepared. Starting transaction processing...');
        await processTransactions();
        console.log(`Processing complete. closing...`);
    } catch (error) {
        console.error('Error in processing cycle:', error);
    }
    

   
}

// Start the monitoring process
startProcessing().catch(error => {
    console.error('Error in monitoring process:', error);
    process.exit(1);
});
