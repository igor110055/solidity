const Web3 = require("web3")
// const web3 = new Web3("ws://127.0.0.1:8545")
const web3 = new Web3("https://bsc-dataseed.binance.org/")


// const privateKey = "0x02a69968be40fd71f967af96cab13a77908c0d501c47578d7539508a800ef408"
// const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address
// web3.eth.accounts.wallet.add(privateKey)

function tokens(n) {
    return Web3.utils.toWei(n, 'ether');
}

async function pancakeGetAmountOut(factory, amountIn, addressIn, addressOut) {
    let amountInWithFee = amountIn * 9975
    let numerator = amountInWithFee * reserveOut
    let denominator = reserveIn * 10000 + amountInWithFee
    return numerator / denominator
}

async function biswapGetAmountOut(factory, amountIn, addressIn, addressOut) {
    let amountInWithFee = amountIn * (1000 - swapFee)
    let numerator = amountInWithFee * reserveOut
    let denominator = reserveIn * 1000 + amountInWithFee
    return numerator / denominator
}


async function main() {
    const bnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    const cakeAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"

    for (let i = 1; i < 5; i++){
        const amount = tokens(i.toString())

        // const afterFirstSwap = (await pRouterContract.methods.getAmountsOut(amount, [bnbAddress, cakeAddress]).call())[1]
        const afterFirstSwapOwn = await pancakeGetAmountOut(pFactoryContract, amount, bnbAddress, cakeAddress)
        // console.log("Official:  ", afterFirstSwap / 1E18)
        // console.log("Calculated:", afterFirstSwapOwn / 1E18)

        // const afterSecondSwap = (await bRouterContract.methods.getAmountsOut(afterFirstSwap, [cakeAddress, bnbAddress]).call())[1]
        const afterSecondSwapOwn = await biswapGetAmountOut(bFactoryContract, afterFirstSwapOwn, cakeAddress, bnbAddress)
        // console.log("Official:  ", afterSecondSwap / 1E18)
        // console.log("Calculated:", afterSecondSwapOwn / 1E18)

        console.log((afterSecondSwapOwn - amount) / 1E18)
        // console.log((amount - afterSecondSwapOwn) / 1E18)
    }



}

main()
