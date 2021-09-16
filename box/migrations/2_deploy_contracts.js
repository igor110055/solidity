const MyContract = artifacts.require("TestSwapContract");

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(MyContract);
    console.log("Done deploying")
};