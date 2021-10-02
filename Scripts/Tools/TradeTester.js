class TradeTester {
    constructor(database) {
        this.database = database
        this.fs = require("fs")

        const Web3 = require("web3")
        this.web3 = new Web3("http://127.0.0.1:8545")

        this.accountAddress = "0x1EB930454a508999C1FB9550720218E407D86e5e"
        this.web3.eth.accounts.wallet.add("97c442ff6999b6a21fd910bb2ea2e11768e575f0a4f3a762fbb96f19033e1668")

        this.contractFile = "ArbitrageFlashSwap.json"
        this.contract = undefined
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
            gasPrice: this.web3.utils.toWei("10", "gwei")
        })

        await this.web3.eth.sendTransaction({
            from: this.accountAddress,
            gas: 5000000,
            gasPrice: this.web3.utils.toWei("10", "gwei"),
            value: this.web3.utils.toWei("1", "ether"),
            to: this.contract.options.address
        })
    }

    async testTrade(token0, token1, amountIn, borrowPair, exchangeA, exchangeB, exchangeC) {
        return new Promise(async resolve => {
            await this.contract.methods.execute(token0, token1, amountIn, borrowPair, exchangeA, exchangeB, exchangeC).send({
                from: this.accountAddress,
                gas: 5000000,
                gasPrice: this.web3.utils.toWei("10", "gwei"),
            }).on("receipt", receipt => {
                console.log("receipt", receipt)
                resolve()
            }).on("error", error => {
                console.log("error", error)
                resolve()
            })
        })
    }
}

module.exports = TradeTester