# Arbitrage Flash Loan Bot

## TODO
- Create algorithm for finding good trade pairs
- Finish Smart Contract functions
- Connect Nodejs Script with Smart Contract

## Ganache-CLI
### Start Local Blockchain (using Ganache-CLI)
> ganache-cli -f https://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/archive -m MNEMONIC-BIP39-STYLE

## Truffle
### Compile
Compiles .sol code to bytecode & creates abi
> truffle compile

### Migrate
Executes migration .js files (used for deploying contracts to blockchain)
> truffle migrate

### Test
Runs all tests (used for testing each smart-contract-function)
> truffle test

### Console
Gives you direct access to all deployed smart-contracts (used for testing and debugging)
> truffle test

## Fixes:
### Web3 BN fix:
> node_modules/number-to-bn/node_modules/bn.js/lib/bn.js

Change:
> assert(false, 'Number can only safely store up to 53 bits');

To
> ret = Number.MAX_SAFE_INTEGER;
