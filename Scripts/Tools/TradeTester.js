class TradeTester {
    constructor(web3) {
        this.web3 = web3

        this.exchanges = []
        for (let i = 1; i < arguments; i++)
            this.exchanges.push(arguments[i])
    }

    async testTrade(token0, token1, amountIn, firstExchange, secondExchange, sellAt){
        return new Promise(resolve => {

        })
    }
}

module.exports = TradeTester