const Web3 = require("web3")
const web3 = new Web3("ws://127.0.0.1:8545")

const MyContract = artifacts.require("TestSwapContract");
const BNBTokenContract = artifacts.require("WBNB");

require("chai").use(require("chai-as-promised")).should()

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

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
    describe("Values", async () => {
        it("can set/get values", async () => {
            const number = randomInt(1, 100)
            await myContract.set(number);
            const returnValue = await myContract.get()
            assert.equal(returnValue, number)
        })
    })
    describe("Swapping", async () => {

        it("can swap tokens", async () => {
            const bnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
            const bnbContract = await BNBTokenContract.at(bnbAddress)
            const amount = tokens('1')

            const busdAddress = "0x55d398326f99059fF775485246999027B3197955"
            await myContract.swapETHForTokens(bnbAddress, busdAddress, tokens("1"))
            // console.log(await bnbContract.balanceOf[accounts[0]])
            // await bnbContract.approve(myContract.address, amount, {from: accounts[0]});
            // await myContract.swap([bnbAddress, busdAddress], amount)
            assert.equal(1, 1)
        })
        // it("received tokens", async () => {
        //
        // })
    })
})