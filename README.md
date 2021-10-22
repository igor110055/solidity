# Arbitrage Flash Loan Bot

## Info
Name commits using prefix [ ]
> Use [sol] for smart-contract changes
> 
> Use [js] for node-js changes
> 
> Use [*] for other changes

## Configuration
### Database-Setup (unpacking)
> ./Scripts/Database/config.rar

## TODO
- Create algorithm for finding good trade pairs
- Connect Nodejs Script with Smart Contract

## Ganache-CLI
### Settings
Mnemonic
> develop oven fiscal debris thank solar science twice similar mix giraffe erupt scorpion quiz hover

### Start Local Blockchain (using Ganache-CLI)
> ganache-cli -f wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/archive/ws -m "develop oven fiscal debris thank solar science twice similar mix giraffe erupt scorpion quiz hover" -e 10000 -d true

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
### Web3 BN fix (not needed atm):
> node_modules/number-to-bn/node_modules/bn.js/lib/bn.js

Change:
> assert(false, 'Number can only safely store up to 53 bits');

To
> ret = Number.MAX_SAFE_INTEGER;
