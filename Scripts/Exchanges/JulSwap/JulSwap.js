const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

/**
 * @class JulSwap
 * @extends Exchange
 */
class JulSwap extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x553990F2CBA90272390f62C5BDb1681fFc899675"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0xbd67d157502A23309Db761c41965600c2Ec788b2"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "JulSwapPairs"
    }

    /**
     * @param pairContract
     * @returns {Promise<number>}
     */
    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(30)
        })
    }
}

module.exports = JulSwap
