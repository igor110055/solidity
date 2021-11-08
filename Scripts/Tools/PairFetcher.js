const {doAsync, saveJson, printHeadline} = require("../Tools/Helpers")
const fs = require("fs")

module.exports = class PairFetcher {
    constructor(database) {
        this.database = database

        this.interval = 30000
        this.parallelBlocks = 5000
        this.showStatus = true

        if (!fs.existsSync(__dirname + "/syncing.json")) {
            fs.writeFileSync(__dirname + "/syncing.json", JSON.stringify({}))
        }
        this.syncingStatus = JSON.parse(fs.readFileSync(__dirname + "/syncing.json"))

        this.exchanges = []
        for (let i = 1; i < arguments.length; i++) {
            this.exchanges.push(arguments[i])

            if (!Object.keys(this.syncingStatus).includes(arguments[i].tableName)) {
                this.syncingStatus[arguments[i].tableName] = {
                    "current": 0
                }
            }
        }
    }

    async start(){
        this.alreadyFetching = false
        const ticker = async () => {
            if (!this.alreadyFetching) {
                this.alreadyFetching = true
                this.currentBlockNumber = await this.exchanges[0].web3.eth.getBlockNumber()
                await doAsync(this.exchanges, e => this.updateDatabase(e))

                if (this.showStatus)
                    await this.printStatus()

                saveJson(__dirname + "/syncing.json", this.syncingStatus)
                this.alreadyFetching = false
            }
        }

        ticker().then()
        setInterval(ticker, this.interval)
    }

    async fetchPairs(exchange, startingBlock, endingBlock) {
        let results = await exchange.getPairs(startingBlock, endingBlock)
        if (results.length > 0) {
            results = results.map(r => r["returnValues"])
            const allTokens = new Set(results.map(r => r["0"]).concat(results.map(r => r["1"])))
            const commands = Array(...allTokens).map(t => `
                select '${t}' from dual where not exists (select * from Tokens where tokenAddress='${t}')
            `)
            await this.database.custom("insert into Tokens (tokenAddress) " + commands.join(" union "))

            results = results.map(r => {
                return {
                    "token0": `(select tokenID from Tokens where tokenAddress = '${r["0"]}' limit 1)`,
                    "token1": `(select tokenID from Tokens where tokenAddress = '${r["1"]}' limit 1)`,
                    "address": r["2"],
                    "number": r["3"],
                }
            })

            await this.database.insertMultiple(
                exchange.tableName,
                Object.keys(results[0]),
                results
            )
        }
        this.syncingStatus[exchange.tableName].current = endingBlock
    }

    async updateDatabase(exchange) {
        const syncedBlock = this.syncingStatus[exchange.tableName]["current"]

        if (this.currentBlockNumber > syncedBlock) {
            const endingBlock = Math.min(this.currentBlockNumber, syncedBlock + this.parallelBlocks)
            await this.fetchPairs(exchange, syncedBlock, endingBlock)
        }
    }

    async printStatus() {
        console.log()
        let finishedExchanges = []
        let waitingFor = []
        for (const exchangeName of Object.keys(this.syncingStatus).filter(e => this.exchanges.map(e => e.tableName).includes(e))) {
            const synced = this.syncingStatus[exchangeName]["current"]
            if (synced === this.currentBlockNumber) {
                finishedExchanges.push(exchangeName)
            } else {
                waitingFor.push(exchangeName)
            }
        }

        printHeadline("Fetching")
        if (finishedExchanges.length > 0) {
            console.log(`Finished: ${finishedExchanges.join(", ")}`)
        }
        if (waitingFor.length > 0) {
            console.log("Waiting for: ")
            for (const exchangeName of waitingFor) {
                const synced = this.syncingStatus[exchangeName]["current"]
                console.log(`${exchangeName}: ${synced}/${this.currentBlockNumber} ` +
                    `\x1b[31m(${(synced / this.currentBlockNumber * 100).toFixed(3)}%)\x1b[0m`
                )
            }
        }
    }
}