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

            const routerContract = new web3.eth.Contract([
                {
                    "inputs": [{
                        "internalType": "address",
                        "name": "_factory",
                        "type": "address"
                    }, {"internalType": "address", "name": "_WETH", "type": "address"}],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                }, {
                    "inputs": [],
                    "name": "WETH",
                    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                    "stateMutability": "view",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "tokenA", "type": "address"}, {
                        "internalType": "address",
                        "name": "tokenB",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "amountADesired", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountBDesired",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountAMin", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountBMin",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "addLiquidity",
                    "outputs": [{
                        "internalType": "uint256",
                        "name": "amountA",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountB", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "amountTokenDesired",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountETHMin",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "addLiquidityETH",
                    "outputs": [{
                        "internalType": "uint256",
                        "name": "amountToken",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountETH", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }],
                    "stateMutability": "payable",
                    "type": "function"
                }, {
                    "inputs": [],
                    "name": "factory",
                    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                    "stateMutability": "view",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOut",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "reserveIn", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "reserveOut",
                        "type": "uint256"
                    }],
                    "name": "getAmountIn",
                    "outputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}],
                    "stateMutability": "pure",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountIn",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "reserveIn", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "reserveOut",
                        "type": "uint256"
                    }],
                    "name": "getAmountOut",
                    "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
                    "stateMutability": "pure",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOut",
                        "type": "uint256"
                    }, {"internalType": "address[]", "name": "path", "type": "address[]"}],
                    "name": "getAmountsIn",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "view",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountIn",
                        "type": "uint256"
                    }, {"internalType": "address[]", "name": "path", "type": "address[]"}],
                    "name": "getAmountsOut",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "view",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountA",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "reserveA", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "reserveB",
                        "type": "uint256"
                    }],
                    "name": "quote",
                    "outputs": [{"internalType": "uint256", "name": "amountB", "type": "uint256"}],
                    "stateMutability": "pure",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "tokenA", "type": "address"}, {
                        "internalType": "address",
                        "name": "tokenB",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "liquidity", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountAMin",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountBMin", "type": "uint256"}, {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "deadline", "type": "uint256"}],
                    "name": "removeLiquidity",
                    "outputs": [{
                        "internalType": "uint256",
                        "name": "amountA",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountB", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountETHMin",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "removeLiquidityETH",
                    "outputs": [{
                        "internalType": "uint256",
                        "name": "amountToken",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountETH", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountETHMin",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "removeLiquidityETHSupportingFeeOnTransferTokens",
                    "outputs": [{"internalType": "uint256", "name": "amountETH", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountETHMin",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }, {"internalType": "bool", "name": "approveMax", "type": "bool"}, {
                        "internalType": "uint8",
                        "name": "v",
                        "type": "uint8"
                    }, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {
                        "internalType": "bytes32",
                        "name": "s",
                        "type": "bytes32"
                    }],
                    "name": "removeLiquidityETHWithPermit",
                    "outputs": [{
                        "internalType": "uint256",
                        "name": "amountToken",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountETH", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountETHMin",
                        "type": "uint256"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }, {"internalType": "bool", "name": "approveMax", "type": "bool"}, {
                        "internalType": "uint8",
                        "name": "v",
                        "type": "uint8"
                    }, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {
                        "internalType": "bytes32",
                        "name": "s",
                        "type": "bytes32"
                    }],
                    "name": "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
                    "outputs": [{"internalType": "uint256", "name": "amountETH", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{"internalType": "address", "name": "tokenA", "type": "address"}, {
                        "internalType": "address",
                        "name": "tokenB",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "liquidity", "type": "uint256"}, {
                        "internalType": "uint256",
                        "name": "amountAMin",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountBMin", "type": "uint256"}, {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "deadline", "type": "uint256"}, {
                        "internalType": "bool",
                        "name": "approveMax",
                        "type": "bool"
                    }, {"internalType": "uint8", "name": "v", "type": "uint8"}, {
                        "internalType": "bytes32",
                        "name": "r",
                        "type": "bytes32"
                    }, {"internalType": "bytes32", "name": "s", "type": "bytes32"}],
                    "name": "removeLiquidityWithPermit",
                    "outputs": [{
                        "internalType": "uint256",
                        "name": "amountA",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountB", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOut",
                        "type": "uint256"
                    }, {"internalType": "address[]", "name": "path", "type": "address[]"}, {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "deadline", "type": "uint256"}],
                    "name": "swapETHForExactTokens",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "payable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOutMin",
                        "type": "uint256"
                    }, {"internalType": "address[]", "name": "path", "type": "address[]"}, {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "deadline", "type": "uint256"}],
                    "name": "swapExactETHForTokens",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "payable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOutMin",
                        "type": "uint256"
                    }, {"internalType": "address[]", "name": "path", "type": "address[]"}, {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }, {"internalType": "uint256", "name": "deadline", "type": "uint256"}],
                    "name": "swapExactETHForTokensSupportingFeeOnTransferTokens",
                    "outputs": [],
                    "stateMutability": "payable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountIn",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {
                        "internalType": "address[]",
                        "name": "path",
                        "type": "address[]"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "swapExactTokensForETH",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountIn",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {
                        "internalType": "address[]",
                        "name": "path",
                        "type": "address[]"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountIn",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {
                        "internalType": "address[]",
                        "name": "path",
                        "type": "address[]"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "swapExactTokensForTokens",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountIn",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {
                        "internalType": "address[]",
                        "name": "path",
                        "type": "address[]"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOut",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountInMax", "type": "uint256"}, {
                        "internalType": "address[]",
                        "name": "path",
                        "type": "address[]"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "swapTokensForExactETH",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {
                    "inputs": [{
                        "internalType": "uint256",
                        "name": "amountOut",
                        "type": "uint256"
                    }, {"internalType": "uint256", "name": "amountInMax", "type": "uint256"}, {
                        "internalType": "address[]",
                        "name": "path",
                        "type": "address[]"
                    }, {"internalType": "address", "name": "to", "type": "address"}, {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    }],
                    "name": "swapTokensForExactTokens",
                    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }, {"stateMutability": "payable", "type": "receive"}], "0x10ED43C718714eb63d5aA57B78B54704E256024E")

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

            await myContract.execute(
                busd, bnb, tokens("1"),
                busd_cake_v2, pancakeV2Router, pancakeV1Router, pancakeV2Router
            )
        })
    })
})