module.exports = class Factory01 {
    constructor(database) {
        this.database = database

        this.exchanges = []
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
        }

        this.WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    }

    async checkForTrades(){

    }


    async checkToken(token) {
        return new Promise(async (resolve, reject) => {
            let possibleTrades = []

            for (const exchange of this.exchanges) {
                let wethPairs = await this.getWETHPairs(token, exchange[1])

                if (wethPairs.length > 0) {
                    for (const wethPair of wethPairs) {
                        const relevantPairs = await this.database.getData(exchange[1],
                            "address, token0, token1, swapFee",
                            `where token0 = "${token}" or token1 = "${token}"`
                        )
                        for (const pair of relevantPairs) {
                            const otherToken = pair["token0"] === token ? pair["token1"] : pair["token0"]
                            console.log(otherToken, exchange[1])
                        }
                    }
                }
            }

            if (possibleTrades.length > 0)
                return resolve(possibleTrades)
            else
                return reject("No WETH Pair found")
        })
    }

    async getWETHPairs(token, exchange) {
        return new Promise(async resolve => {
            const relevantPairs = await this.database.getData(exchange,
                "address, token0, token1, swapFee",
                `where (token0="${token}" and token1="${this.WETH}") or (token0="${this.WETH}" and token1="${token}")`
            )
            return resolve(relevantPairs)
        })
    }
}
