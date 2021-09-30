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
            const biswapFactory = "0x858E3312ed3A876947EA49d572A7C42DE08af7EE"
            const pancakeV1Factory = "0xBCfCcbde45cE874adCB698cC183deBcF17952812"
            const pancakeV2Factory = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
            const biswapRouter = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8"
            const pancakeV1Router = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"
            const pancakeV2Router = "0x10ED43C718714eb63d5aA57B78B54704E256024E"

            const busd = "0x55d398326f99059fF775485246999027B3197955"
            const bnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
            const pancakeV1Pair = "0x20bCC3b8a0091dDac2d0BC30F68E6CBb97de59Cd"
            const pancakeV2Pair = "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE"

            const temp = `
                function execute(
                    address _token0, address _token1, uint _amountIn,
                    address _borrowPair, address _factoryA,
                    address _factoryB, address _routerSell
                )`
            await myContract.swapCall(bnb, busd, tokens("1"), pancakeV1Router, pancakeV2Router)
            // await myContract.execute(
            //     bnb, busd, tokens("1"),
            //     pancakeV2Pair, pancakeV1Factory, pancakeV2Factory, biswapFactory
            // )
        })
    })
})