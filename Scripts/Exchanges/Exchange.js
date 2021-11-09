module.exports = class Exchange {
    constructor(web3) {
        if (new.target === Exchange)
            throw new Error("Class is abstract.")

        this.web3 = web3
        this.WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
        this.tableStructure = {
            "number": "int primary key auto_increment",
            "address": "varchar(45) unique",
            "token0": "int",
            "token1": "int",
            "totalWETH": "text",
            "useful": "bool"
        }
    }

    async getSwapFee(pairContract) {
        throw new Error("You need to overwrite this function.")
    }
    
    async getReserves(token0, token1) {
        return new Promise(async (resolve, reject) => {
            const pairAddress = await this.factoryContract.methods.getPair(token0, token1).call()
            if (pairAddress === "0x0000000000000000000000000000000000000000")
                return reject("Not a valid pair")

            const pairContract = new (this.web3()).eth.Contract(this.pairABI, pairAddress)
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
        return new Promise(async (resolve, reject) => {
            try{
                const pairContract = new (this.web3()).eth.Contract(this.pairABI, pairAddress)
                const { _reserve0, _reserve1 } = await pairContract.methods.getReserves().call()

                const token0InPair = await pairContract.methods.token0.call().call()

                return resolve({
                    "reserve0": token0 === token0InPair ? _reserve0 : _reserve1,
                    "reserve1": token0 === token0InPair ? _reserve1 : _reserve0
                })
            } catch (e){
                console.log("crashed (getReservesFromPair)", pairAddress, token0, e.message)
                reject()
            }
        })
    }

    async getPairs(startingBlock, endingBlock){
        return new Promise(async resolve => {
            resolve(this.factoryContract.getPastEvents("PairCreated", {
                fromBlock: startingBlock,
                toBlock: endingBlock
            }))
        })
    }

    async swapToWETH(amountIn, token) {
        return new Promise(async resolve => {
            if (token !== this.WETH) {
                try {
                    const amountsOut = await this.routerContract.methods.getAmountsOut(amountIn.toString(), [token, this.WETH]).call()
                    return resolve(amountsOut[1])
                } catch{
                    return resolve(0)
                }
            }
            return resolve(amountIn)
        })
    }
}