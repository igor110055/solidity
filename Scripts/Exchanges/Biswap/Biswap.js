const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

/**
 * @class Biswap
 * @extends Exchange
 */
class Biswap extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x858E3312ed3A876947EA49d572A7C42DE08af7EE"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "BiswapPairs"
    }

    /**
     * @param pairContract
     * @returns {Promise<number>}
     */
    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(10)
        })
    }
}

module.exports = Biswap
