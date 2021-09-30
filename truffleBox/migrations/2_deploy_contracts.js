const myContract = artifacts.require("ArbitrageFlashSwap");

module.exports = function (deployer) {
    deployer.deploy(myContract);
};