import { sleep } from 'k6';
import exec from 'k6/execution';
import { signTransaction_v2, waitForTicketIdCallback, waitForTransactionHash } from './controllers/cosignerController.js';
import { SharedArray } from 'k6/data';
import envConfig from '../config/config.js';
import file from 'k6/x/file';


const ticketIDFile = './data/ticketID_data.txt';

const rawTxns = new SharedArray('rawTxns', function () {
  const f =  JSON.parse(open(`../data/rawTx.json`));
  return f; // f must be an array
});


export const options = {
  // discardResponseBodies: true,
    scenarios: {
        contacts: {
        executor: 'per-vu-iterations',
        vus: 500,
        iterations: 195
        },
    },
   cloud: {
    // Project: MNEE-QA
    projectID: 4821759,
    // Test runs with the same name groups test runs together.
    name: 'Performance Test V2 APIs'
  }
};

// select config based on environment variable

const consignerConfig = envConfig['mnee'][__ENV.ENV]?.consigner || {};
const consignerHost = consignerConfig.HOST || '';

export default function () {    
    
    const rawtx = rawTxns[(__VU-1) + (__ITER * 10)];

    // Step 2: Sign the transaction using Cosigner API
    const ticketID = signTransaction_v2(consignerHost, rawtx);
    if (!ticketID) return;
    // console.log(`User ${__VU} -- ${__ITER}-- rawtx: ${rawtx}`);
    console.log(`User ${__VU} -- ${__ITER}-- TicketID: ${ticketID}`);
    
    file.appendString(ticketIDFile, `${ticketID}\n`);

    sleep(0.5);
}


