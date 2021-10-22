const Exchange = require("../Exchange")

class JetSwap extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")

        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x0eb58E5c8aA63314ff5547289185cC4583DfCBD5"
        this.factoryContract = new this.web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0xBe65b8f75B9F20f4C522e0067a3887FADa714800"
        this.routerContract = new this.web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "JetSwapPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(30)
        })
    }
}

module.exports = JetSwap
