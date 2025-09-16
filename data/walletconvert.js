const fs = require('fs');
const path = require('path');

function convertCsvToJson() {
    try {
        // Read the CSV file
        const csvPath = path.join(__dirname, 'wallets', 'Book1.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        
        // Split content into lines and filter out empty lines
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        const wallets = [];
        let currentWallet = {};
        console.log
        for (let i = 0; i < lines.length; i = i + 2) {
           
            // Start a new wallet object
            currentWallet = {
                'walletId': lines[i].split(',')[1].trim(),
                'ordAddress': lines[i + 1].split(',')[1].trim()
            };
            wallets.push(currentWallet);

        }
        // const result = JSON.stringify(wallets, null, 2);
        // Write to JSON file
        const outputPath = path.join(__dirname, 'wallets', 'wallets_stg.json');
        fs.writeFileSync(outputPath, JSON.stringify(wallets, null, 2), 'utf8');
        
        console.log(`Successfully converted ${wallets.length} wallets to JSON`);
        console.log(`Output file: ${outputPath}`);
        
        // Display first few entries as sample
        console.log('\nSample output:');
        console.log(JSON.stringify(wallets.slice(0, 3), null, 2));
        
        return result;
        
    } catch (error) {
        console.error('Error converting CSV to JSON:', error.message);
        throw error;
    }
}

// Run the conversion if this file is executed directly
if (require.main === module) {
    convertCsvToJson();
}

module.exports = { convertCsvToJson };
