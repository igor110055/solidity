const Web3 = require("web3")
const fs = require("fs")
const ganache = require("ganache-cli")
const util = require("util")

/**
 * @type {TradeTester}
 */
class TradeTester {
    /**
     * @param database
     */
    constructor(database) {
        this.database = database

        const log_file = fs.createWriteStream(__dirname + '/Logs/tradeTester.log', {flags: 'w'});

        this.web3 = new Web3(ganache.provider({
            fork: "wss://speedy-nodes-nyc.moralis.io/37acbafabefa6ebb98e3b282/bsc/mainnet/archive/ws",
            mnemonic: "develop oven fiscal debris thank solar science twice similar mix giraffe erupt scorpion quiz hover",
            default_balance_ether: 10000,
            total_accounts: 10,
            logger: {
                log: log => {
                    log_file.write(util.format(log) + '\n');
                },
                error: log => {
                    log_file.write(util.format(log) + '\n');
                }
            }
        }))

        this.accountAddress = "0x1EB930454a508999C1FB9550720218E407D86e5e"
        this.web3.eth.accounts.wallet.add("97c442ff6999b6a21fd910bb2ea2e11768e575f0a4f3a762fbb96f19033e1668")

        this.contractFile = "ArbitrageFlashSwap.json"
        this.contract = undefined
        this.transactionCount = undefined
    }

    /**
     * @returns {Promise<void>}
     */
    async setup() {
        const jsonData = JSON.parse(fs.readFileSync(`../truffleBox/build/contracts/${this.contractFile}`).toString())
        const abi = jsonData["abi"]
        const bytecode = jsonData["bytecode"]
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
            value: this.web3.utils.toWei("10", "ether"),
            to: this.contract.options.address
        })

        this.transactionCount = await this.web3.eth.getTransactionCount(this.accountAddress)
    }

    /**
     * @param token0
     * @param token1
     * @param amountIn
     * @param borrowPair
     * @param exchangeA
     * @param exchangeB
     * @param exchangeC
     * @returns {Promise<unknown>}
     */
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
                gasPrice: this.web3.utils.toWei("10", "gwei"),
                nonce: this.transactionCount
            }).on("receipt", async () => {
                this.contract.getPastEvents("LogFlashSwap", {
                    filter: {"fsID": fsID},
                    fromBlock: (await this.web3.eth.getBlockNumber()) - 10,
                    toBlock: "latest"
                }, async (error, result) => {
                    if (error) {
                        console.log("Event crashed:", error)
                        return resolve(0)
                    } else {
                        const profitWETH = result[0]["returnValues"]["profit"]
                        await this.database.insert("Trades", {
                            "fsID": fsID,
                            "token0": `(select tokenID from Tokens where tokenAddress = '${token0}' limit 1)`,
                            "token1": `(select tokenID from Tokens where tokenAddress = '${token1}' limit 1)`,
                            "amountIn": amountIn,
                            "borrowPair": borrowPair,
                            "exchangeA": exchangeA,
                            "exchangeB": exchangeB,
                            "exchangeC": exchangeC,
                            "profitWETH": profitWETH,
                            "timestamp": new Date().getTime()
                        })
                        return resolve(profitWETH)
                    }
                })
            }).on("error", error => {
                try {
                    const data = error["results"]
                    const txn = Object.keys(data).filter(key => key.startsWith("0x"))[0]
                    return reject(data[txn]["reason"] !== undefined ? data[txn]["reason"] : "Other error: " + data[txn]["error"])
                } catch {
                    console.log("error", error)
                }
            })
            this.transactionCount += 1
        })
    }
}

module.exports = TradeTester