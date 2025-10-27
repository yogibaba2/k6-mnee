import http from 'k6/http';
import encoding from 'k6/encoding';
import { sleep } from 'k6';
import file from 'k6/x/file';

const ticketIDsLogFilePath = '../logs.txt';

const defaultOptions = {
    headers: { 
        'Content-Type': 'application/json'
    }
};

export function signTransaction_v2(host, rawtx) {
    const payload = JSON.stringify({ rawtx, callback_url: "http://10.40.173.198:80/v1/webhook" });
    const response = http.post(`${host}/v2/transfer`, payload, defaultOptions);
    if(response.status !== 200){
        console.error(`Cosigner v2 signTransaction failed. response: ${JSON.stringify(response)}`);
        return null;
    }
    return response.body;
}

export function signTransaction_v1(host, rawtx) {
    const payload = JSON.stringify({ rawtx });
    const response = http.post(`${host}/v1/transfer`, payload, defaultOptions);
    return JSON.parse(response.body)["rawtx"];
}

export function base64ToHexCode(str) {
    const bytes = new Uint8Array(encoding.b64decode(str)); // ArrayBuffer -> bytes
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
}

export function getTransactionHashByTicketID(host, ticketID) {
    const op = {
        headers: { 
            'Content-Type': 'application/json'
        },
        tags: { name: `${host}/v1/ticket?ticketID` }
    }
    const response = http.get(`${host}/v1/ticket?ticketID=${ticketID}`, op);
    const result = JSON.parse(response.body);
    
    if (result.status === 'SUCCESS') {
        return result.tx_id;
    }
    return null;
}

export function waitForTransactionHashOld(host, ticketID, txSubmissionTime, timeToBroadcast) {
    let txHash = null;
    const trendTags = {
        name: 'Time To Broadcast',
        method: 'None',
        status: '200'

    }
    while (!txHash) {
        sleep(0.25)
        txHash = getTransactionHashByTicketID(host, ticketID);
        if (txHash) {
            console.log(`Transaction Hash: ${txHash}`);
            timeToBroadcast.add(Date.now() - txSubmissionTime, trendTags);
            return txHash;
        }   
    }
}

export function waitForTicketIdCallback(host, ticketID, txSubmissionTime, timeToBroadcast) {
    let txHash = null;
    const trendTags = {
        name: 'Time To Broadcast',
        method: 'None',
        status: '200'

    }
    while (!txHash) {
       const fileContent = file.readFile(ticketIDsLogFilePath); 
           fileContent.split('\n').some((line, index) => {
               if(line.includes(ticketID)) {
                   console.log(`User ${__VU} -- Callback received for Ticket ID ${ticketID} - Line ${index + 1}`);
                   
                   console.log(`Checking for Transaction Hash for Ticket ID: ${ticketID}`);
                   txHash = getTransactionHashByTicketID(host, ticketID);
                   console.log(`User ${__VU} -- Transaction Hash: ${txHash} for TicketId: ${ticketID}`);
                    if (txHash) {
                        timeToBroadcast.add(Date.now() - txSubmissionTime, trendTags);
                        // file.removeRowsBetweenValues(ticketIDsLogFilePath, index + 1, index + 1);
                        return true;
                    }
               }
           });  
    }
    return txHash;
}

export function checktIDInFile(ticketID) {
    const fileContent = file.readFile(ticketIDsLogFilePath);
    fileContent.split('\n').forEach((line, index) => {
        if(line.includes(ticketID)) {
            console.log(`Line ${index + 1}: ${line}`);
            file.removeRowsBetweenValues(ticketIDsLogFilePath, index + 1, index + 1);
        }
    });
    }
