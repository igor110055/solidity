module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 60000
        this.parallelFetchLimit = 0
        this.showStatus = false

        this.exchanges = []
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])
        }

        const ticker = () => this.exchanges.forEach(e => this.updateDatabase(e))

        ticker()
        setInterval(ticker, this.interval)
    }

    async fetchPairs(exchange) {
        const totalMissingPairs = (await this.database.getData(exchange,
            "count(*) as n", "where address is null")
        )[0]["n"]

        if (totalMissingPairs > 0) {
            const pairsFetching = await this.database.getData(exchange, "number",
                "where address is null" + (this.parallelFetchLimit > 0 ? ` limit ${this.parallelFetchLimit}` : "")
            )

            for (const missingPair of pairsFetching) {
                const pairNumber = missingPair["number"] - 1

                exchange.getPair(pairNumber).then(result => {
                    this.database.updateData(exchange, {"number": pairNumber + 1}, result)
                }).catch(error => {
                    console.log(`Could not fetch pair: ${pairNumber} in table: `+
                        `${exchange.tableName} (${exchange.databaseName}) because of: ${error}`
                    )
                })
            }
        }
    }

    async updateDatabase(exchange) {
        if (this.showStatus){
            await this.printStatus(exchange)
        }
        const allKnownPairs = (await this.database.getData(exchange, "count(*) as n"))[0]["n"]
        const totalPairs = await exchange.getTotalPairs()

        if (totalPairs > allKnownPairs) {
            for (let i = 0; i < totalPairs - allKnownPairs; i++)
                this.database.saveData(exchange)

            console.log(`Creating ${totalPairs - allKnownPairs} value(s) in table ${exchange.tableName} (${exchange.databaseName})`)
        }
        await this.fetchPairs(exchange)
    }

    async printStatus(exchange){
        const allKnownPairs = (await this.database.getData(exchange, "count(*) as n"))[0]["n"]
        const allFetchedPairs = (await this.database.getData(exchange, "count(*) as n", "where address not null"))[0]["n"]
        console.log(`${exchange.tableName} (${exchange.databaseName}): ${allFetchedPairs}/${allKnownPairs} `+
            `\x1b[31m(${(allFetchedPairs/allKnownPairs*100).toFixed(3)}%)\x1b[0m`
        )
    }
}