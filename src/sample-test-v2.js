import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { transferTokens } from './controllers/treasuryController.js';
import { signTransaction_v2, waitForTransactionHash } from './controllers/cosignerController.js';
import { checkMempool } from './controllers/wocController.js';
import { SharedArray } from 'k6/data';
// import { openKv } from "k6/x/kv";
// import { readTransactionData } from './utils/fileWriter.js';
// import path from 'path';
import file from 'k6/x/file';


const filePath = './data/transaction_data.txt';

const wallets = new SharedArray('wallets', function () {
  const f =  JSON.parse(open('../data/wallets.json'));
  return f; // f must be an array
});

// const kv = openKv();

let txnArray = [];

const envConfig = 
{
"mnee-qa": {
    "treasury": {
      "HOST": "https://qa-api-treasury.mnee.net/api/1.0.0",
      "API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJibG9ja3NhdG9zaGkiLCJpYXQiOjE3MzYzNTU1MzJ9.L656Y4QlwSPXIszcwNVtSlo7OBcm66i2wrouba60n88"
    },
    "consigner": {
      "HOST": "https://qa-api-cosigner.mnee.net"
    }
  },
  "woc": {
    "HOST": "https://api.whatsonchain.com/v1/bsv/main"
  }
};

// Custom metrics
export const timeToBroadcast = new Trend('broadcast_duration');
export const mempoolDuration = new Trend('mempool_duration');
export const firstConfirmationTime = new Trend('first_confirmation_time');
export const sixthConfirmationTime = new Trend('sixth_confirmation_time');

export const options = {
//   iterations: 100,
//     vus: 5,
// duration: 100s
stages: [
    { duration: '5s', target: 5 }, 
    { duration: '10s', target: 5 },
    { duration: '5s', target: 0 }, 
  ],
   cloud: {
    // Project: MNEE-QA
    projectID: 4174674,
    // Test runs with the same name groups test runs together.
    name: 'Performance Test V2 APIs'
  }
};

// Read and parse the environment config
// const envConfig = JSON.parse(readFileSync('../environment/qa.json', 'utf8'));

// Choose the correct app and service
const mneeTreasury = envConfig['mnee-qa']?.treasury || {};
const mneeHost = mneeTreasury.HOST || '';
const mneeApiKey = mneeTreasury.API_KEY || '';

const consignerConfig = envConfig['mnee-qa']?.consigner || {};
const consignerHost = consignerConfig.HOST || '';

const wocConfig = envConfig['woc'] || {};
const wocHost = wocConfig.HOST || '';


// export async function setup() {
//     // Start with a clean state
//     // await kv.clear();
// }


export default function () {

    let txnData = {};
    
    const conCurrentWallet = wallets[__VU - 1];

    // Step 1: Create and transfer tokens using Treasury API
    const transferPayload = {
        "walletId": conCurrentWallet.walletId,
        "address": "1KYgN9EGzynBNWt5mYpFsssnctnE8D2YR9",
        "amount": 1,
        "broadcast":false
    };
    
    const rawtx = transferTokens(mneeHost, mneeApiKey, transferPayload);
    if (!rawtx) return;

    // Step 2: Sign the transaction using Cosigner API
    const txSubmissionTime = Date.now();
    const ticketID = signTransaction_v2(consignerHost, rawtx);
    if (!ticketID) return;

    // Step 3: Get transaction hash
    const txHash = waitForTransactionHash(consignerHost, ticketID, txSubmissionTime, timeToBroadcast);
    if (!txHash) return;
    txnData['txHash'] = txHash;

    // // const txHash = "d0b96c7573c034f4aff2a19d159648067dcc635c5f02c691facc67cb6e4fe901";
    // console.log(`Transaction Hash: ${typeof  txHash}`);
    const startTime = Date.now();
    // Step 4: Check mempool using WoC API
    const inMempool = checkMempool(wocHost, txHash, startTime, mempoolDuration);
    if (!inMempool) return;
    txnData['mempoolTime'] = inMempool;

    file.appendString(filePath, `${txHash}\n`);

    // Step 5: Check for confirmations
    // Check for first confirmation
    // checkNthConfirmation(host, txHash, startTime, 1, firstConfirmationTime);
      
    // Check for sixth confirmation
    // checkNthConfirmation(host, txHash, startTime, 6, sixthConfirmationTime);

    // txnArray.push(txnData);

    // kv.set(txHash, JSON.stringify(txnData));

    sleep(1);
}

// export function handleSummary(data) {
//     return {
//         // './data/transaction_data.json': JSON.stringify(txnArray, null, 2),
//         './data/transaction_data.txt': kv.list({}),
//     };
// }

