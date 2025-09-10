import http from 'k6/http';

const defaultOptions = {
    headers: { 
        'Content-Type': 'application/json'
    }
};

export function checkMempool(host, txHash, startTime, mempoolDuration) {
    let inmempool = false;
    let mempoolTime = 0;

    const trendTags = {
        name: 'Time to Mempool',
        method: 'None',
        status: '200'

    }

    while(!inmempool) {
        const mempoolResponse = http.get(`${host}/mempool/raw`, defaultOptions);
        const mempoolData = JSON.parse(mempoolResponse.body);
        if (mempoolData && mempoolData.length > 0) {
            const foundTx = mempoolData.find(tx =>tx == txHash);
            if (foundTx) {
                mempoolTime = Date.now() - startTime;
                mempoolDuration.add(mempoolTime, trendTags);
                console.log(`Transaction ${txHash} found in mempool. Time: ${mempoolTime} ms`);
                return mempoolTime;
            }
        }
        else {
        return false;
        }
    }
    return false;
}

export function checkNthConfirmation(host, txHash, startTime, n, durationMetric) {
    const payload = JSON.stringify({
        "txids": [txHash]
    });

    let confirmed = false;
    while(!confirmed) {
        const response = http.post(`${host}/txs/status`, payload, defaultOptions);
        const confirmations = JSON.parse(response.body)[0].confirmations;
        
        if (confirmations >= n) {
            const timestamp = Date.now() - startTime;
            durationMetric.add(timestamp);
            console.log(`Transaction ${txHash} has ${confirmations} confirmations. Time: ${timestamp} ms`);
            confirmed = true;
        }
    }
    return true;
}

export function checkConfirmations(host, txHash, startTime, firstConfirmationTime, sixthConfirmationTime) {
    // Check for first confirmation
    checkNthConfirmation(host, txHash, startTime, 1, firstConfirmationTime);
    
    // Check for sixth confirmation
    checkNthConfirmation(host, txHash, startTime, 6, sixthConfirmationTime);
}

export function decodedTransaction(host, hex){
    const payload = JSON.stringify({ "txhex": hex });
    const respose = http.post(`${host}/tx/decode`, payload, defaultOptions);
    const txid = JSON.parse(respose.body)["txid"];
    return txid;
}
