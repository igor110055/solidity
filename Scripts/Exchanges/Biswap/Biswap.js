const Exchange = require("../Exchange")

class Biswap extends Exchange {
    constructor(web3) {
        if (web3 === undefined)
            throw new Error("Constructor not satisfied")
        super();
        this.factoryABI = require("./ABIs/Factory.json")
        this.pairABI = require("./ABIs/Pair.json")

        this.factoryAddress = "0x858E3312ed3A876947EA49d572A7C42DE08af7EE"

        this.web3 = web3
        this.factoryContract = new this.web3.eth.Contract(this.factoryABI, this.factoryAddress)
    }

    async getReserves(addressIn, addressOut) {
        return new Promise(async (resolve, reject) => {
            const pairAddress = await this.factoryContract.methods.getPair(addressIn, addressOut).call()
            if (pairAddress === "0x0000000000000000000000000000000000000000")
                return reject("Not a valid pair")

            const pairContract = new this.web3.eth.Contract(this.pairABI, pairAddress)
            const {_reserve0, _reserve1} = await pairContract.methods.getReserves().call()

            const address0InPair = await pairContract.methods.token0.call().call()

            return resolve([
                address0InPair === addressIn ? _reserve0 : _reserve1,
                address0InPair === addressOut ? _reserve0 : _reserve1,
                (await pairContract.methods.swapFee.call().call()) * 10
            ])
        })
    }

    async getAmountOut(amountIn, reserve0, reserve1, fee) {
        return new Promise(async (resolve, reject) => {
            if (amountIn <= 0 || reserve0 <= 0 || reserve1 <= 0)
                return reject("At least 1 value is <= 0")

            let amountInWithFee = amountIn * (10000 - fee)
            let numerator = amountInWithFee * reserve1
            let denominator = reserve0 * 10000 + amountInWithFee
            return resolve(numerator / denominator)
        })
    }

    async getTotalPairs() {
        return new Promise(async resolve => {
            const allPairsLength = await this.factoryContract.methods.allPairsLength.call().call()
            return resolve(allPairsLength)
        })
    }

    async getPair(number) {
        return new Promise(async (resolve, reject) => {
            let pairAddress;
            try {
                pairAddress = await this.factoryContract.methods.allPairs(number).call()
                if (pairAddress === "0x0000000000000000000000000000000000000000")
                    return reject("Not a valid pair")

                const pairContract = new this.web3.eth.Contract(this.pairABI, pairAddress)
                const {_reserve0, _reserve1} = await pairContract.methods.getReserves().call()

                const token0 = await pairContract.methods.token0.call().call()
                const token1 = await pairContract.methods.token1.call().call()

                const swapFee = (await pairContract.methods.swapFee.call().call()) * 10
                return resolve({
                    "address": pairAddress,
                    "token0": token0,
                    "token1": token1,
                    "reserve0": _reserve0,
                    "reserve1": _reserve1,
                    "swapFee": swapFee
                })
            } catch (e) {
                return reject(e.toString())
            }

        })
    }
}

module.exports = Biswap
