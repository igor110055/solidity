const Exchange = require("../Exchange")

class JulSwap extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")

        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x553990F2CBA90272390f62C5BDb1681fFc899675"
        this.factoryContract = new this.web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0xbd67d157502A23309Db761c41965600c2Ec788b2"
        this.routerContract = new this.web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "JulSwapPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(30)
        })
    }
}

module.exports = JulSwap
