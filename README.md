# K6 Load Testing Project

This project performs load testing for BSV blockchain transactions using K6. It includes scripts for testing both V1 and V2 APIs of the MNEE treasury and cosigner services.

## Project Structure

```
k6-load-test-project
├── src/
│   ├── controllers/
│   │   ├── cosignerController.js
│   │   ├── treasuryController.js
│   │   └── wocController.js
│   ├── utils/
│   │   ├── base64Utils.js
│   │   └── fileWriter.js
│   ├── sample-test-v1.js
│   └── sample-test-v2.js
├── config/
│   └── config.js
├── data/
│   ├── transaction_data.json
│   ├── transaction_data.txt
│   └── wallets.json
├── environment/
│   └── qa.json
├── reports/
├── confirmationMonitor.js
├── transactionMonitor.js
├── package.json
└── README.md
```

## Features

- Load testing of BSV blockchain transactions
- Support for both V1 and V2 API endpoints
- Transaction monitoring and confirmation tracking
- Mempool monitoring
- Performance metrics collection
- JSON and text-based transaction data storage

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [K6](https://k6.io/docs/getting-started/installation)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd k6-load-test-project
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Configuration

Update the environment configuration in `environment/qa.json` with your API credentials and endpoints.

### Running Tests

1. Run V2 API tests:
   ```
   npm run test
   ```

2. Run cloud-based tests:
   ```
   npm run cloud-test
   ```

3. Run local execution with cloud reporting:
   ```
   npm run cloud-local-test
   ```

4. Run with Prometheus metrics:
   ```
   npm run test-prometheus
   ```

### Monitoring

1. Start the transaction monitor:
   ```
   node transactionMonitor.js
   ```

2. Start the confirmation monitor:
   ```
   node confirmationMonitor.js
   ```

## Metrics

The tests collect the following metrics:
- Time to broadcast
- Mempool duration
- First confirmation time
- Sixth confirmation time

## Contributing

Please follow the existing code style and add unit tests for any new features.

## License

This project is licensed under the MIT License.