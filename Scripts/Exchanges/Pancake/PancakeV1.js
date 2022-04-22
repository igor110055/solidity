const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

/**
 * @class PancakeV1
 * @extends Exchange
 */
class PancakeV1 extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/PairV2.json")

        this.factoryABI = require("./ABIs/FactoryV1.json")
        this.factoryAddress = "0xBCfCcbde45cE874adCB698cC183deBcF17952812"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "PancakeV1Pairs"
    }

    /**
     * @param pairContract
     * @returns {Promise<number>}
     */
    async getSwapFee(pairContract){
        return new Promise(resolve => {
            return resolve(20)
        })
    }
}

module.exports = PancakeV1
