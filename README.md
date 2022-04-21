# Arbitrage Flash Loan Bot

## Info
The current providers which are used to retrieve trading data use rate limits.

Because of this the bot will not be able to run at full speed.


## Setup
### General setup (run in terminal):
> npm install

### Database-Setup (unpack using Password):
> ./Scripts/Database/config.rar

## Ganache-CLI
### Settings
Mnemonic
> develop oven fiscal debris thank solar science twice similar mix giraffe erupt scorpion quiz hover

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