const myContract = artifacts.require("TestSwapContract");

// const Web3 = require("web3")
// const web3 = new Web3("ws://127.0.0.1:8545")
// const privateKey = "0x02a69968be40fd71f967af96cab13a77908c0d501c47578d7539508a800ef408"
// const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address
// web3.eth.accounts.wallet.add(privateKey)

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(myContract);
    //const contractAddress = (await myContract.deployed()).address
    // console.log("Done deploying")
    // const ownContract = await myContract.deployed()
};