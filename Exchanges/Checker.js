const Web3 = require("web3")
const web3URL = "https://bsc-dataseed.binance.org/"
const web3 = new Web3(web3URL)

const Pancake = require("./Pancake/Pancake")
const pancake = new Pancake(web3URL)
const Biswap = require("./Biswap/Biswap")
const biswap = new Biswap(web3URL)

function tokens(n) {
    return Web3.utils.toWei(n, 'ether');
}

async function calculate(tokenInput, aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
    let amountInWithFee = tokenInput * (10000 - aFee)
    let numerator = amountInWithFee * aToken1Reserve
    let denominator = aToken0Reserve * 10000 + amountInWithFee
    let afterSwapOne = numerator / denominator

    amountInWithFee = afterSwapOne * (10000 - bFee)
    numerator = amountInWithFee * bToken0Reserve
    denominator = bToken1Reserve * 10000 + amountInWithFee
    return (numerator / denominator) - tokenInput
}

async function calculateExtrema(aToken0Reserve, aToken1Reserve, aFee, bToken0Reserve, bToken1Reserve, bFee) {
    return (10000 * Math.sqrt(bToken1Reserve) * Math.sqrt((aToken0Reserve * aToken1Reserve * aFee - 10000 * aToken0Reserve * aToken1Reserve) * bToken0Reserve * bFee + (100000000 * aToken0Reserve * aToken1Reserve - 10000 * aToken0Reserve * aToken1Reserve * aFee) * bToken0Reserve) - 100000000 * aToken0Reserve * bToken0Reserve) / ((aToken1Reserve * aFee - 10000 * aToken1Reserve) * bFee + (100000000 - 10000 * aFee) * bToken0Reserve - 10000 * aToken1Reserve * aFee + 100000000 * aToken1Reserve)
}

async function main() {
    const pRouterContract = new web3.eth.Contract(require("./pancakeRouterABI.json"), "0x10ED43C718714eb63d5aA57B78B54704E256024E")
    const bRouterContract = new web3.eth.Contract(require("./biswapRouterABI.json"), "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8")
    const bnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    const cakeAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"

    let [pBNBReserve, pCakeReserve, pFee] = await pancake.getReserves(bnbAddress, cakeAddress).catch(console.log)
    let [bBNBReserve, bCakeReserve, bFee] = await biswap.getReserves(bnbAddress, cakeAddress).catch(console.log)

    bBNBReserve = bBNBReserve * 1.1

    let extrema = await calculateExtrema(pBNBReserve, pCakeReserve, pFee, bCakeReserve, bBNBReserve, bFee)
    if (extrema <= 0) {
        console.log("Not a valid trade.")
    } else {
        console.log("Found: " + extrema / 1E18)
        const profit = await calculate(extrema, pBNBReserve, pCakeReserve, pFee, bBNBReserve, bCakeReserve, bFee)
        console.log(`Profit: ${profit / 1E18} BNB`)
    }

    const amount = tokens('1')


    const afterFirstSwap = (await pRouterContract.methods.getAmountsOut(amount, [bnbAddress, cakeAddress]).call())[1]
    const afterFirstSwapOwn = await pancake.getAmountOut(amount, pBNBReserve, pCakeReserve, pFee).catch(console.log)
    console.log("Official:  ", afterFirstSwap / 1E18)
    console.log("Calculated:", afterFirstSwapOwn / 1E18)
    console.log("Difference:", (afterFirstSwap - afterFirstSwapOwn) / 1E18)
    console.log()

    const afterSecondSwap = (await bRouterContract.methods.getAmountsOut(afterFirstSwap, [cakeAddress, bnbAddress]).call())[1]
    const afterSecondSwapOwn = await biswap.getAmountOut(afterFirstSwapOwn, bCakeReserve, bBNBReserve, bFee).catch(console.log)
    console.log("Official:  ", afterSecondSwap / 1E18)
    console.log("Calculated:", afterSecondSwapOwn / 1E18)
    console.log("Difference:", (afterSecondSwap - afterSecondSwapOwn) / 1E18)
    console.log((afterSecondSwap - amount) / 1E18)
    // console.log((afterSecondSwapOwn - amount) / 1E18)
    // console.log((amount - afterSecondSwapOwn) / 1E18)
}

main()
