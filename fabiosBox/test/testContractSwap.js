const Web3 = require("web3")
// const exchangeABI = require("./pancakeRouterABI.json");
const web3 = new Web3("ws://127.0.0.1:8545")

const MyContract = artifacts.require("TestSwapContract");

require("chai").use(require("chai-as-promised")).should()

function tokens(n) {
    return Web3.utils.toWei(n, 'ether');
}

function getAmountOut(amountIn, reserveIn, reserveOut) {
    let amountInWithFee = amountIn * 9975
    let numerator = amountInWithFee * reserveOut
    let denominator = reserveIn * 10000 + amountInWithFee
    return numerator / denominator
}

contract("TestSwapContract", accounts => {
    let myContract, wMyContract;
    before(async () => {
        myContract = await MyContract.new()
        wMyContract = new web3.eth.Contract(myContract.abi, myContract.address)

        wMyContract.events.allEvents((error, result) => {
            if (error) {
                console.log("Event crashed".red)
            } else {
                const values = result.returnValues
                const keys = Object.keys(values)
                let filteredValues = {}
                for (let i = keys.length / 2; i < keys.length; i++) {
                    filteredValues[keys[i]] = values[keys[i]]
                }
                console.log(
                    "Event:".cyan,
                    result.event.red,
                    JSON.stringify(filteredValues, null, 2).yellow
                )
            }
        })
    })
    describe("Swapping", async () => {
        it("can swap tokens", async () => {
            const bnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
            const cakeAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
            const busdAddress = "0x55d398326f99059fF775485246999027B3197955"

            await web3.eth.sendTransaction({from: accounts[1], to: myContract.address, value: tokens('2')})
            let balance = await web3.eth.getBalance(myContract.address)
            console.log(balance)
            const exchangeABI = require("./contracts/ApeFactory.json")
            const exchangeContract = new web3.eth.Contract(exchangeABI, "0x10ED43C718714eb63d5aA57B78B54704E256024E")

            exchangeContract.methods.swapExactETHForTokens(0, [bnbAddress, cakeAddress],
                myContract.address, Math.floor(Date.now() / 1000) + 20).send({
                from: accounts[1],
                gas: 1500000,
                gasPrice: web3.utils.toWei("20", "gwei"),
                value: tokens("1")
            }).on("receipt", async () => {
                console.log("Tokens bought")
                // wMyContract.methods.execute(cakeAddress, bnbAddress, tokens('1'), ["p", "p"]).send({
                //     from: accounts[1],
                //     gas: 2000000,
                //     gasPrice: web3.utils.toWei("10", "gwei")
                // })
                await myContract.execute(bnbAddress, cakeAddress, tokens('1'), ["p", "p"])
                assert.equal(1, 1)
            })
        })
    })
})