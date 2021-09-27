module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 3000
        this.parallelFetchLimit = 400
        this.showStatus = true
        this.parallelInsertLimit = 300

        this.exchanges = []
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
        }

        const ticker = () => this.exchanges.forEach(e => this.updateDatabase(e))

        ticker()
        setInterval(ticker, this.interval)
    }

    async fetchPairs(exchange) {
        const missingPairs = await this.database.getData(exchange.tableName, "number", "where address is null" +
            (this.parallelFetchLimit > 0 ? ` limit ${this.parallelFetchLimit}` : "")
        )

        if (missingPairs.length > 0) {
            for (const missingPair of missingPairs) {
                const pairNumber = missingPair["number"] - 1

                exchange.getPair(pairNumber).then(result => {
                    this.database.updateData(exchange.tableName, {"number": pairNumber + 1}, result)
                }).catch(error => {
                    console.log(`Could not fetch pair: ${pairNumber} (${exchange.tableName}) because of: ${error}`)
                })
            }
        }
    }

    async updateDatabase(exchange) {
        if (this.showStatus){
            await this.printStatus(exchange)
        }

        const allKnownPairs = (await this.database.getData(exchange.tableName, "count(*) as n"))[0]["n"]
        const totalPairs = await exchange.getTotalPairs()

        if (totalPairs > allKnownPairs) {
            const number = totalPairs - allKnownPairs <= this.parallelInsertLimit ? totalPairs - allKnownPairs : this.parallelInsertLimit
            for (let i = 0; i < number; i++)
                this.database.saveData(exchange.tableName)
        }
        await this.fetchPairs(exchange)
    }

    async printStatus(exchange){
        const allKnownPairs = (await this.database.getData(exchange.tableName, "count(*) as n"))[0]["n"]
        const allFetchedPairs = (await this.database.getData(exchange.tableName, "count(*) as n", "where address not null"))[0]["n"]

        console.log(`${exchange.tableName}: ${allFetchedPairs}/${allKnownPairs} `+
            `\x1b[31m(${(allFetchedPairs/allKnownPairs*100).toFixed(3)}%)\x1b[0m`
        )
    }
}