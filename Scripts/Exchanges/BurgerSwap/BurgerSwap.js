const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

class BurgerSwap extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x8a1E9d3aEbBBd5bA2A64d3355A48dD5E9b511256"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x789c11212EaCA5312d4aa6d63148613e658CcFAd"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "BurgerSwapPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(30)
        })
    }
}

module.exports = BurgerSwap
