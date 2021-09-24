const myContract = artifacts.require("TestSwapContract");

module.exports = function (deployer) {
    deployer.deploy(myContract);
};