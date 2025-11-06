import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const JSON_FILE_PATH = path.join(__dirname, "./data/ticketID_data.txt");
const OUTPUT_FILE_PATH = path.join(__dirname, "./data/transaction_data.json");
const CONSIGNER_HOST = 'stg-api-cosigner.mnee.net';
const TICKET_ID_PATH = '/v1/ticket?ticketID=';
const PROCCESSED_TICKETS = [];

// Helper function to make HTTP requests
async function makeHttpRequest(options, postData = null) {
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

async function writeProccessedTransaction() {
    // write processed transaction data to output file
    console.log('Writing processed transaction data to file...');
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(PROCCESSED_TICKETS, null, 2));
    console.log(`Processed transaction data written to ${OUTPUT_FILE_PATH}`);
}

async function fetchTicketIdStatus(ticketID) {
    const options = {
        hostname: CONSIGNER_HOST,
        path: `${TICKET_ID_PATH}${ticketID}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        // console.log(`Checking status for ticket id = ${ticketID}`);
        const response = await makeHttpRequest(options);
        // console.log('Response data:', response.data);
        return response.data;
    } catch (error) {
        console.error(`Error checking for ticket status: ${ticketID}`, error);
        return null;
    }
}

async function processTicketIdsFromFile() {
    try {
        const data = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
        const ticketIDs = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log(`Found ${ticketIDs.length} ticket IDs to process.`);
        // make below loop multi threaded 
        
        for (const ticketID of ticketIDs) {
           const response = await fetchTicketIdStatus(ticketID);
           if (response) {
            console.log(`Ticket ID: ${ticketID}, Status: ${response.status}`);
                let transaction_data = {
                    ticketID: ticketID,
                    txHash: response.tx_id,
                    firstConfirmationTime: null,
                    blockHeight: null,
                    sixthConfirmationTime: null,
                    timestamp: new Date(response.updatedAt).getTime(),
                    broadcastTime: new Date(response.updatedAt) - new Date(response.createdAt),
                    status: response.status,
                };
                PROCCESSED_TICKETS.push(transaction_data);
           }
        }
    } catch (error) {
        console.error('Error reading ticket IDs from file:', error);
        throw error;
    }
    finally {
        await writeProccessedTransaction();
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startProcessing() {
    console.log(`checking file: ${JSON_FILE_PATH}`);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nStopping process...');
        writeProccessedTransaction()
        process.exit(0);
    });


    try {
        console.log('Processing Ticket ids...');
        await processTicketIdsFromFile();
        console.log(`Processing complete. closing...`);
    } catch (error) {
        console.error('Error in processing cycle:', error);
    }
    

   
}

// await fetchTicketIdStatus('09c30834-25e7-4d13-9fc6-0dfe1a411917');

// Start the monitoring process
startProcessing().catch(error => {
    console.error('Error in monitoring process:', error);
    process.exit(1);
});
