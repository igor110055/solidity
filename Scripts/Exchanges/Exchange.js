module.exports = class Exchange {
    constructor(web3) {
        if (new.target === Exchange)
            throw new Error("Class is abstract.")

        this.web3 = web3
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
            const { _reserve0, _reserve1 } = await pairContract.methods.getReserves().call()

            const token0InPair = await pairContract.methods.token0.call().call()

            return resolve({
                "reserve0": token0 === token0InPair ? _reserve0 : _reserve1,
                "reserve1": token0 === token0InPair ? _reserve1 : _reserve0,
                "swapFee": await this.getSwapFee(pairContract)
            })
        })
    }

    async getReservesFromPair(pairAddress, token0) {
        return new Promise(async resolve => {
            try{
                const pairContract = new this.web3.eth.Contract(this.pairABI, pairAddress)
                const { _reserve0, _reserve1 } = await pairContract.methods.getReserves().call()

                const token0InPair = await pairContract.methods.token0.call().call()

                return resolve({
                    "reserve0": token0 === token0InPair ? _reserve0 : _reserve1,
                    "reserve1": token0 === token0InPair ? _reserve1 : _reserve0
                })
            } catch (e){
                console.log("crashed", pairAddress, token0)
                resolve({
                    "reserve0": 0,
                    "reserve1": 0
                })
            }
        })
    }

    async getTotalPairs() {
        return new Promise(async resolve => {
            const allPairsLength = await this.factoryContract.methods.allPairsLength.call().call()
            return resolve(allPairsLength)
        })
    }

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

    async swapToETH(amountIn, token) {
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