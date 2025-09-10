# K6 Load Testing Project

This project is designed to perform load testing using K6. It includes a sample load testing script that simulates user behavior on a website.

## Project Structure

```
k6-load-test-project
├── src
│   └── sample-test.js
├── package.json
└── README.md
```

## Getting Started

To get started with this project, follow the steps below:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine. You will also need to install K6. You can find installation instructions on the [K6 website](https://k6.io/docs/getting-started/installation).

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd k6-load-test-project
   ```

2. Install the necessary dependencies:
   ```
   npm install
   ```

### Running the Load Tests

To run the K6 load tests, use the following command:

```
k6 run src/sample-test.js
```

### Sample Test Script

The sample test script located in `src/sample-test.js` simulates a user visiting a website and includes metrics for performance testing. You can modify this script to suit your testing needs.

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.