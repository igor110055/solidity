module.exports = class Exchange {
    constructor(web3) {
        if (new.target === Exchange)
            throw new Error("Class is abstract.")
        this.web3 = web3
    }

    async getReserves(addressIn, addressOut) {
        throw new Error("You must override this function.")
    }
    async getAmountOut(amountIn, reserve0, reserve1){
        throw new Error("You must override this function.")
    }
}