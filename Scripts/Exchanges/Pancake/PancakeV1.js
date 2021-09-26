const Exchange = require("../Exchange")

class PancakeV1 extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")

        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/PairV2.json")

        this.factoryABI = require("./ABIs/FactoryV1.json")
        this.factoryAddress = "0xBCfCcbde45cE874adCB698cC183deBcF17952812"
        this.factoryContract = new this.web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.tableName = "PancakeV1Pairs"
    }

    async getSwapFee(pairContract){
        return new Promise(resolve => {
            return resolve(20)
        })
    }
}

module.exports = PancakeV1
