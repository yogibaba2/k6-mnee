import http from 'k6/http';
// import crypto from 'k6/crypto';
// import { base64ToHex } from '../utils/base64Utils.js';
import encoding from 'k6/encoding';
import { sleep } from 'k6';
// import atob from 'atob';

const defaultOptions = {
    headers: { 
        'Content-Type': 'application/json'
    }
};

export function signTransaction_v2(host, rawtx) {
    const payload = JSON.stringify({ rawtx });
    const response = http.post(`${host}/v2/transfer`, payload, defaultOptions);
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

export function waitForTransactionHash(host, ticketID, txSubmissionTime, timeToBroadcast) {
    let txHash = null;
    const trendTags = {
        name: 'Time To Broadcast',
        method: 'None',
        status: '200'

    }
    while (!txHash) {
        txHash = getTransactionHashByTicketID(host, ticketID);
        if (txHash) {
            console.log(`Transaction Hash: ${txHash}`);
            timeToBroadcast.add(Date.now() - txSubmissionTime, trendTags);
            return txHash;
        }
        sleep(0.5)
    }
}
