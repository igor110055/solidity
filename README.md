# Arbitrage Flash Loan Bot

## TODO
- Create algorythm for finding good trade pairs
- implement smart contract

## Infos
Flash Swaps only work with a ETH (BNB) pair?
Loan money from different pair?
Use pancakeswap alone for 2 different pairs with same token?
> https://bscscan.com/tx/0x6de133cd2122ccacc80958f67393082aed80012361d907c51a2899ee73d45044
> 
> https://bscscan.com/address/0xd58452191837ed8f2380f76dd7bd49a23489e3f2
> 
> https://bscscan.com/address/0x9f6d9842615a68b5b57b9e52871ddc27609915f8

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
