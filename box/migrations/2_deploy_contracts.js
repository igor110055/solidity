console.log("test")
let testSwap = artifacts.require("TestSwapContract");
let pancakeFactory = artifacts.require("PancakeFactory")

module.exports = function(deployer, network, accounts) {
    console.log("Deploying Factory")
    deployer.deploy(pancakeFactory)
    console.log("Deployed Factory")
};