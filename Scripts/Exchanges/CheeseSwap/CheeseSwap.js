const Exchange = require("../Exchange")

class CheeseSwap extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")

        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0xdd538E4Fd1b69B7863E1F741213276A6Cf1EfB3B"
        this.factoryContract = new (this.web3()).eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x3047799262d8D2EF41eD2a222205968bC9B0d895"
        this.routerContract = new (this.web3()).eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "CheeseSwapPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(20)
        })
    }
}

module.exports = CheeseSwap
