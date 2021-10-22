const Web3 = require("web3")
const web3 = new Web3("ws://127.0.0.1:8545")

const MyContract = artifacts.require("ArbitrageFlashSwap");

require("chai").use(require("chai-as-promised")).should()

function tokens(n) {
    return Web3.utils.toWei(n, 'ether');
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
        it("can do stuff", async () => {
            const biswapRouter = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8"
            const pancakeV1Router = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"
            const pancakeV2Router = "0x10ED43C718714eb63d5aA57B78B54704E256024E"

            const bnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
            const usdt = "0x55d398326f99059fF775485246999027B3197955"
            const busd = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"

            const busd_bnb_v2 = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16"
            const usdt_bnb_v2 = "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE"
            const cake_bnb_v2 = "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0"
            const busd_cake_v2 = "0x804678fa97d91B974ec2af3c843270886528a9E6"

            const routerContract = new web3.eth.Contract(require("./pancakeRouterABI.json"), "0x10ED43C718714eb63d5aA57B78B54704E256024E")

            await routerContract.methods.swapExactETHForTokens(0, [bnb, busd], myContract.address, Math.floor(Date.now() / 1000) + 20).send({
                from: accounts[1],
                gas: 1500000,
                gasPrice: web3.utils.toWei("20", "gwei"),
                value: tokens("10")
            })

            await web3.eth.sendTransaction({
                from: accounts[1],
                gas: 1500000,
                gasPrice: web3.utils.toWei("20", "gwei"),
                value: tokens("10"),
                to: myContract.address
            })

            await myContract.execute("123",
                busd, bnb, tokens("1"),
                busd_cake_v2, pancakeV2Router, pancakeV1Router, pancakeV2Router
            )
        })
    })
})