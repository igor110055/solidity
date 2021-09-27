module.exports = class Exchange {
    constructor(web3) {
        if (new.target === Exchange)
            throw new Error("Class is abstract.")

        this.WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    }

    async getSwapFee(pairContract) {
        throw new Error("You need to overwrite this function.")
    }

    async getReserves(token0, token1) {
        return new Promise(async (resolve, reject) => {
            const pairAddress = await this.factoryContract.methods.getPair(token0, token1).call()
            if (pairAddress === "0x0000000000000000000000000000000000000000")
                return reject("Not a valid pair")

            const pairContract = new this.web3.eth.Contract(this.pairABI, pairAddress)
            const {_reserve0, _reserve1} = await pairContract.methods.getReserves().call()

            const token0InPair = await pairContract.methods.token0.call().call()

            return resolve([
                token0InPair === token0 ? _reserve0 : _reserve1,
                token0InPair === token1 ? _reserve0 : _reserve1,
                await this.getSwapFee(pairContract)
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
            try {
                const pairAddress = await this.factoryContract.methods.allPairs(number).call()
                if (pairAddress === "0x0000000000000000000000000000000000000000")
                    return reject("Not a valid pair")

                const pairContract = new this.web3.eth.Contract(this.pairABI, pairAddress)
                const token0 = await pairContract.methods.token0.call().call()
                const token1 = await pairContract.methods.token1.call().call()

                return resolve({
                    "address": pairAddress,
                    "token0": token0,
                    "token1": token1
                })
            } catch (e) {
                return reject(e.toString())
            }
        })
    }

    async swapToETH(amountIn, token0) {
        return new Promise(async resolve => {
            if (token0 !== this.WETH) {
                try {
                    const amountsOut = await this.routerContract.methods.getAmountsOut(amountIn.toString(), [token0, this.WETH]).call()
                    return resolve(amountsOut[1])
                } catch {
                    return resolve(0)
                }
            }
            return resolve(amountIn)
        })
    }
}