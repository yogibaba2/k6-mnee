import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { transferTokens } from './controllers/treasuryController.js';
import { signTransaction_v2, waitForTransactionHash } from './controllers/cosignerController.js';
import { checkMempool } from './controllers/wocController.js';
import { SharedArray } from 'k6/data';
import envConfig from '../config/config.js';
import file from 'k6/x/file';


const filePath = './data/transaction_data.txt';

const wallets = new SharedArray('wallets', function () {
  const f =  JSON.parse(open(`../data/wallets/wallets_${__ENV.ENV}.json`));
  return f; // f must be an array
});


// Custom metrics
export const timeToBroadcast = new Trend('broadcast_duration');
export const mempoolDuration = new Trend('mempool_duration');
// export const firstConfirmationTime = new Trend('first_confirmation_time');
// export const sixthConfirmationTime = new Trend('sixth_confirmation_time');

export const options = {
//   iterations: 100,
//     vus: 5,
// duration: 100s
stages: [
    { duration: '10s', target: 10 }, 
    { duration: '280s', target: 10 },
    { duration: '10s', target: 0 }, 
  ],
   cloud: {
    // Project: MNEE-QA
    projectID: 4174674,
    // Test runs with the same name groups test runs together.
    name: 'Performance Test V2 APIs'
  }
};

// select config based on environment variable
const mneeTreasury = envConfig['mnee'][__ENV.ENV]?.treasury || {};
const mneeHost = mneeTreasury.HOST || '';
const mneeApiKey = mneeTreasury.API_KEY || '';

const consignerConfig = envConfig['mnee'][__ENV.ENV]?.consigner || {};
const consignerHost = consignerConfig.HOST || '';

const wocConfig = envConfig['woc'] || {};
const wocHost = wocConfig.HOST || '';


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

    sleep(1);
}


