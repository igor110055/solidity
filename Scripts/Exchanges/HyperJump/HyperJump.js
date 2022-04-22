const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

/**
 * @class HyperJump
 * @extends Exchange
 */
class HyperJump extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0xaC653cE27E04C6ac565FD87F18128aD33ca03Ba2"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x3bc677674df90A9e5D741f28f6CA303357D0E4Ec"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "HyperJumpPairs"
    }

    /**
     * @param pairContract
     * @returns {Promise<number>}
     */
    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(40)
        })
    }
}

module.exports = HyperJump
