const {web3} = require("../Tools/Helpers")

/**
 * @class Exchange
 */
class Exchange {
    constructor() {
        if (new.target === Exchange)
            throw new Error("Class is abstract.")

        this.WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
        this.tableStructure = {
            "number": "int primary key auto_increment",
            "address": "varchar(45) unique",
            "token0": "int",
            "token1": "int"
        }
    }

    /**
     * @param pairContract
     * @returns {Promise<void>}
     */
    async getSwapFee(pairContract) {
        throw new Error("You need to overwrite this function.")
    }

    /**
     * @param token0
     * @param token1
     * @returns {Promise<unknown>}
     */
    async getReserves(token0, token1) {
        return new Promise(async (resolve, reject) => {
            const pairAddress = await this.factoryContract.methods.getPair(token0, token1).call()
            if (pairAddress === "0x0000000000000000000000000000000000000000")
                return reject("Not a valid pair")

            const pairContract = new web3.eth.Contract(this.pairABI, pairAddress)
            const {_reserve0, _reserve1} = await pairContract.methods.getReserves().call()

            const token0InPair = await pairContract.methods.token0.call().call()

            return resolve({
                "reserve0": token0 === token0InPair ? _reserve0 : _reserve1,
                "reserve1": token0 === token0InPair ? _reserve1 : _reserve0,
                "swapFee": await this.getSwapFee(pairContract)
            })
        })
    }

    /**
     * @param pairAddress
     * @param token0
     * @returns {Promise<unknown>}
     */
    async getReservesFromPair(pairAddress, token0) {
        return new Promise(async (resolve, reject) => {
            try {
                const pairContract = new web3.eth.Contract(this.pairABI, pairAddress)
                const {_reserve0, _reserve1} = await pairContract.methods.getReserves().call()

                const token0InPair = await pairContract.methods.token0.call().call()

                return resolve({
                    "reserve0": token0 === token0InPair ? _reserve0 : _reserve1,
                    "reserve1": token0 === token0InPair ? _reserve1 : _reserve0
                })
            } catch (e) {
                console.log("crashed (getReservesFromPair)", pairAddress, token0, e.message)
                reject()
            }
        })
    }

    /**
     * @returns {Promise<unknown>}
     */
    async getTotalPairs() {
        return new Promise(async resolve => {
            const allPairsLength = await this.factoryContract.methods.allPairsLength.call().call()
            return resolve(allPairsLength)
        })
    }

    /**
     * @param number
     * @returns {Promise<unknown>}
     */
    async getPairUsingNumber(number) {
        return new Promise(async (resolve, reject) => {
            try {
                const pairAddress = await this.factoryContract.methods.allPairs(number).call()
                if (pairAddress === "0x0000000000000000000000000000000000000000")
                    return reject("Not a valid pair")

                const pairContract = new this.web3.eth.Contract(this.pairABI, pairAddress)
                const token0 = await pairContract.methods.token0.call().call()
                const token1 = await pairContract.methods.token1.call().call()

                return resolve({
                    "number": number,
                    "address": pairAddress,
                    "token0": token0,
                    "token1": token1
                })
            } catch (e) {
                return reject(e.toString())
            }
        })
    }

    /**
     * @param amountIn
     * @param token
     * @returns {Promise<unknown>}
     */
    async swapToWETH(amountIn, token) {
        return new Promise(async resolve => {
            if (token !== this.WETH) {
                try {
                    const amountsOut = await this.routerContract.methods.getAmountsOut(amountIn.toString(), [token, this.WETH]).call()
                    return resolve(amountsOut[1])
                } catch {
                    return resolve(0)
                }
            }
            return resolve(amountIn)
        })
    }
}

module.exports = Exchange