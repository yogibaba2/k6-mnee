import fs from 'fs';
import { execSync } from 'child_process';
import https from 'https';


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

//wait for ticketid to be mined
async function waitForTicketMined(ticketId) {

    const options = {
        hostname: 'stg-api-cosigner.mnee.net',
        path: `/v1/ticket?ticketID=${ticketId}`,
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    console.log(`Checking status for ticketID: ${ticketId}`);
    let mined = false;
    while (!mined) {

        try {
            const response = await makeHttpRequest(options);
            if (response && response.data) {
                mined = response.data.status === 'SUCCESS';
            }
        } catch (error) {
            console.error('Error checking confirmations:', error);
            return null;
        }
    }
}



async function fundWalletInBatches(batchSize){
    const srcWallet =  JSON.parse(fs.readFileSync('wallets-src.json', 'utf8'));

    // rename original file to avoid overwriting
    fs.renameSync('wallets.json', 'wallets_backup.json');

    // Read wallet addresses from new file
    const data = fs.readFileSync('wallets_backup.json', 'utf8');
    const wallets = JSON.parse(data);

    console.log(`Total wallets to fund: ${wallets.length}`);
    //iterate through wallets in batches
    for (let i = 0; i < srcWallet.length; i ++) {
        const offset = i * batchSize;
        if (offset + batchSize > wallets.length) {
            console.log('All wallets processed.');
            break;
        }
        const batch = wallets.slice(offset, offset + batchSize);

        // create a new file for the current batch with wallets.json name
        await fs.writeFileSync('wallets.json', JSON.stringify(batch, null, 2));

        // execute funding command for the current batch
        console.log(`Funding wallets from index ${offset} to ${offset + (batchSize-1)}`);
        // run the mnee-man command fund wallets 
        
        const output = execSync(`./mnee-man -wif ${srcWallet[i]['wif']} -address ${srcWallet[i]['address']} -mneeUrl https://stg-api-cosigner.mnee.net -fundAmount 1000 -fund true`).toString();
        // get stdout from command

        
        console.log(`Funding complete from index ${offset} to ${offset + (batchSize-1)}`);

        // const ticketId = output.toString().split('\n')[1].split('Response: ')[1].trim();
        // console.log(`Waiting for ticket ${ticketId} to be success...`);
        // await waitForTicketMined(ticketId);
        
        // remove the current batch file after funding
        fs.unlinkSync('wallets.json');
        // break; // remove this break to process all batches
    }
    // rename original file to back to correct name
    fs.renameSync('wallets_backup.json', 'wallets.json');
}


async function combineAllHexFile(pathToDir='.', prefix) {
    // read all hex*.json files in current directory
    console.log('Combining all hex*.json files into combined-hex.json');
    const hexFiles = fs.readdirSync(pathToDir).filter(file => file.startsWith('hex') && file.endsWith('.json'));
    let combinedHexes = [];
    for (const file of hexFiles) {
        let data = fs.readFileSync(`${pathToDir}/${file}`, 'utf8');
        console.log(`we are here ${file}`)
        //replace last char with ']',  if its comma
        if(data.trim().endsWith(',')){
            data = data.trim().slice(0, -1) + ']';
        }
        if(data.trim().endsWith(',]')){
            data = data.trim().slice(0, -2) + ']';
        }
        // const hexes = [];
        const hexes = JSON.parse(data);
        console.log(`Read ${hexes.length} hexes from file: ${file}`);
        combinedHexes = combinedHexes.concat(hexes);
    }
    //write them to combined-hex.json'
    console.log(`Writing combined hexes to combined-hex.json`);
    fs.writeFileSync(`${prefix}_combined-hex.json`, JSON.stringify(combinedHexes, null, 2));
    console.log(`Combined ${hexFiles.length} files into ${prefix}_combined-hex.json with total ${combinedHexes.length} hexes.`);
    
    //delete individual hex files
    for (const file of hexFiles) {
        fs.unlinkSync(`${pathToDir}/${file}`);
    }
}

async function generateRawtx(filename){
    try {
        // rename original file to avoid overwriting
        console.log(`Generating rawtx for file: ${filename}`);

        console.log('creating back up for wallets.json');
        fs.renameSync('wallets.json', 'wallets_backup.json');

        // Rename file to wallets.json
        console.log(`Renaming ${filename} to wallets.json for processing`);
        fs.renameSync(filename, 'wallets.json');

        //execute command to generate rawtx
        console.log('Executing mnee-man command to generate rawtx');
        const output = execSync(`./mnee-man -mneeUrl "https://stg-api-cosigner.mnee.net" -parallel 100 -partial true`,  {stdio: 'inherit'});
        console.log('Rawtx generation command executed successfully.');
    }
    catch (error) {
        console.error('Error generating rawtx:', error);
    }
    finally {
        // rename original file to back to correct name
        console.log('Restoring original wallets.json and renaming processed file back to original name');
        fs.renameSync('wallets.json', filename);
        fs.renameSync('wallets_backup.json', 'wallets.json');

        await combineAllHexFile('.', filename.replace('.json', ''));
    }

} 

async function generateRawtxForList(fileList){
    for (let index = 0; index < fileList.length; index++) {
        const file = fileList[index];
        await generateRawtx(file);
    }
}

async function chunkwallets( chunkSize) {
    //read wallets.js
    const wallets = JSON.parse(fs.readFileSync('1MWallets.json', 'utf8'));

    //iterate through wallet and slice into chunks , create a new wallet_{index}.json file for each chunk
    for (let i = 0; i < wallets.length; i += chunkSize) {
        const chunk = wallets.slice(i, i + chunkSize);
        const chunkFileName = `wallets_chunk_${i}_to_${i + (chunkSize - 1)}.json`;
        fs.writeFileSync(chunkFileName, JSON.stringify(chunk, null, 2));
        console.log(`Created ${chunkFileName} with ${chunk.length} wallets.`);
    }
}

// await fundWalletInBatches(5000)
// await waitForTicketMined('fa0ed891-3fdb-4b6c-8ef1-b186f2821ada');
const fileList = ['wallets_chunk_399996_to_499995.json',
'wallets_chunk_499995_to_599994.json',
'wallets_chunk_599994_to_699993.json',
'wallets_chunk_699993_to_799992.json',
'wallets_chunk_799992_to_899991.json',
'wallets_chunk_899991_to_999990.json'
]
// await generateRawtxForList(fileList);
// await generateRawtx('wallets_chunk_0_to_99999.json');
// await combineAllHexFile('./100k_hexes');
await chunkwallets(100000);