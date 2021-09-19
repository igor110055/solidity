module.exports = class Exchange {
    constructor(web3URL) {
        if (new.target === Exchange)
            throw new Error("Class is abstract.")
        this.web3URL = web3URL
    }

    async getReserves(addressIn, addressOut) {
        throw new Error("You must override this function.")
    }
    async getAmountOut(amountIn, reserve0, reserve1){
        throw new Error("You must override this function.")
    }
}