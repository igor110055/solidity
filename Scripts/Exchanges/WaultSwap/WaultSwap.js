const Exchange = require("../Exchange")

class WaultSwap extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")

        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0xB42E3FE71b7E0673335b3331B3e1053BD9822570"
        this.factoryContract = new this.web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0xD48745E39BbED146eEC15b79cBF964884F9877c2"
        this.routerContract = new this.web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "WaultSwapPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(20)
        })
    }
}

module.exports = WaultSwap
