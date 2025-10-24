import http from 'k6/http';

export function transferTokens(host, apiKey, payload) {
    const params = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    };

    const response = http.post(`${host}/transferTokens`, JSON.stringify(payload), params);
    
    if (response.status !== 200) {
        console.error(`Treasury request failed. Status: ${response.status}`);
        return null;
    }

    const { rawtx } = JSON.parse(response.body);
    console.log(`User ${__VU} -- Raw Transaction: ${rawtx}`);
    return rawtx;
}

export function transferTokensBinary(host, payload) {
    const params = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = http.post(`${host}/v1/partial`, JSON.stringify(payload), params);
    
    if (response.status !== 200) {
        console.error(`Treasury request failed. Status: ${response.status}`);
        return null;
    }

    const { rawtx } = JSON.parse(response.body);
    console.log(`User ${__VU} -- Raw Transaction: ${rawtx}`);
    return rawtx;
}
