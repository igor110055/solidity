const Exchange = require("../Exchange")
const { web3 } = require("../../Tools/Helpers")

class Mdex extends Exchange {
    constructor() {
        super();

        this.web3 = web3
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryABI = require("./ABIs/Factory.json")
        this.factoryAddress = "0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8"
        this.factoryContract = new web3.eth.Contract(this.factoryABI, this.factoryAddress)

        this.routerABI = require("./ABIs/Router.json")
        this.routerAddress = "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8"
        this.routerContract = new web3.eth.Contract(this.routerABI, this.routerAddress)

        this.tableName = "MdexPairs"
    }

    async getSwapFee(pairContract){
        return new Promise(async resolve => {
            return resolve(this.factoryContract.methods.getPairFees(pairContract.options.address).call())
        })
    }
}

module.exports = Mdex
