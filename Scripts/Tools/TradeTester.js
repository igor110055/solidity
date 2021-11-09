class TradeTester {
    constructor(database) {
        this.database = database
        this.fs = require("fs")

        const Web3 = require("web3")
        this.web3 = new Web3("ws://127.0.0.1:8545")

        this.accountAddress = "0x1EB930454a508999C1FB9550720218E407D86e5e"
        this.web3.eth.accounts.wallet.add("97c442ff6999b6a21fd910bb2ea2e11768e575f0a4f3a762fbb96f19033e1668")

        this.contractFile = "ArbitrageFlashSwap.json"
        this.contract = undefined
        this.transactionCount = undefined
    }

    async setup() {
        const file = JSON.parse(this.fs.readFileSync(`../truffleBox/build/contracts/${this.contractFile}`).toString())
        const abi = file["abi"]
        const bytecode = file["bytecode"]
        this.contract = new this.web3.eth.Contract(abi, undefined)

        this.contract = await this.contract.deploy({
            data: bytecode
        }).send({
            from: this.accountAddress,
            gas: 5000000,
            gasPrice: (this.web3()).utils.toWei("10", "gwei")
        })

        await (this.web3()).eth.sendTransaction({
            from: this.accountAddress,
            gas: 5000000,
            gasPrice: (this.web3()).utils.toWei("10", "gwei"),
            value: (this.web3()).utils.toWei("10", "ether"),
            to: this.contract.options.address
        })

        this.transactionCount = await (this.web3()).eth.getTransactionCount(this.accountAddress)
    }

    async testTrade(token0, token1, amountIn, borrowPair, exchangeA, exchangeB, exchangeC) {
        // console.log({
        //     "\x1b[0mTokens": `${token0} --> ${result["token1"]}`,
        //     "\x1b[0mamountIn": amountIn,
        //     "\x1b[0mExchanges": `${exchangeA} --> ${exchangeB} (${exchangeC})`,
        //     "\x1b[0mProfit?": profitUSD
        // })

        return new Promise(async (resolve, reject) => {
            const fsID = (Math.random() * (1E18 - 1E17) + 1E17).toString()

            this.contract.methods.execute(fsID, token0, token1, amountIn, borrowPair, exchangeA, exchangeB, exchangeC).send({
                from: this.accountAddress,
                gas: 5000000,
                gasPrice: (this.web3()).utils.toWei("10", "gwei"),
                nonce: this.transactionCount
            }).on("receipt", async () => {
                this.contract.getPastEvents("LogFlashSwap", {
                    filter: {"fsID": fsID},
                    fromBlock: (await (this.web3()).eth.getBlockNumber()) - 10,
                    toBlock: "latest"
                }, (error, result) => {
                    if (error) {
                        console.log("Event crashed:", error)
                        return resolve(0)
                    } else {
                        return resolve(result[0]["returnValues"]["profit"])
                    }
                })
            }).on("error", error => {
                const data = error["data"]
                const txn = Object.keys(data).filter(key => key.startsWith("0x"))[0]
                return reject(data[txn]["reason"] !== undefined ? data[txn]["reason"] : "Other error: " + data[txn]["error"])
            })
            this.transactionCount += 1
        })
    }
}

module.exports = TradeTester