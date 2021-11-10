const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

class PancakeV2 extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/PairV2.json")

        this.factoryABI = require("./ABIs/FactoryV2.json")
        this.factoryAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "PancakeV2Pairs"
    }

    async getSwapFee(pairContract) {
        return new Promise(resolve => {
            return resolve(25)
        })
    }
}

module.exports = PancakeV2
