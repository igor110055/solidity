module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 30000
        this.parallelFetchLimit = 350
        this.parallelInsertLimit = 350
        this.showStatus = false

        this.exchanges = []
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
        }

        this.alreadyFetching = false
        const ticker = async () => {
            if (!this.alreadyFetching) {
                this.alreadyFetching = true
                const promises = []
                this.exchanges.forEach(e => promises.push(this.updateDatabase(e)))
                await Promise.all(promises)
                this.alreadyFetching = false
            }
        }

        ticker().then()
        setInterval(ticker, this.interval)
    }

    async fetchPairs(exchange) {
        const missingPairs = await this.database.select(exchange.tableName, "number", "where address is null" +
            (this.parallelFetchLimit > 0 ? ` limit ${this.parallelFetchLimit}` : "")
        )

        if (missingPairs.length > 0) {
            let promises = []

            for (const missingPair of missingPairs) {
                const pairNumber = missingPair["number"] - 1
                promises.push(exchange.getPairUsingNumber(pairNumber))
            }

            Promise.all(promises).then(async results => {
                for (let i = 0; i < results.length; i++)
                    results[i]["number"] += 1

                await this.database.updateMultiple(exchange.tableName, Object.keys(results[0]), results, "number")
            }).catch(error => {
                console.log(`Could not fetch a pair: (${exchange.tableName}) because of: ${error}`)
            })
        }
    }

    async updateDatabase(exchange) {
        const allKnownPairs = (await this.database.select(exchange.tableName, "count(*) as n"))[0]["n"]
        const totalPairs = await exchange.getTotalPairs()

        if (this.showStatus)
            await this.printStatus(exchange, allKnownPairs, totalPairs)


        if (totalPairs > allKnownPairs) {
            const required = totalPairs - allKnownPairs
            const number = required <= this.parallelInsertLimit ? required : this.parallelInsertLimit
            await this.database.insertMultiple(exchange.tableName, undefined, undefined, number)
        }
        await this.fetchPairs(exchange)
    }

    async printStatus(exchange, allKnownPairs, totalPairs) {
        console.log(`${exchange.tableName}: ${allKnownPairs}/${totalPairs} ` +
            `\x1b[31m(${(allKnownPairs / totalPairs * 100).toFixed(3)}%)\x1b[0m`
        )
    }
}