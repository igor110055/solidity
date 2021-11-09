const Exchange = require("../Exchange")

class ApeSwap extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")

        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6"
        this.factoryContract = new (this.web3()).eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7"
        this.routerContract = new (this.web3()).eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "ApeSwapPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(20)
        })
    }
}

module.exports = ApeSwap
