// SPDX-License-Identifier: UNLICENSED

import "../dependencies/interfaces/Pancake/IPancakeRouter02.sol";
import "../dependencies/interfaces/Pancake/IPancakePair.sol";

import "../dependencies/interfaces/IERC20.sol";
import "../dependencies/interfaces/IWETH.sol";

pragma solidity >= 0.6.6 < 0.8.0;

// e1 = Wrong borrowPair (fn_execute)
// e2 = Function caller is not a Pair (fn_swapCall)
// e3 = Arbitrage-Operation wasn't profitable (fn_swapCall)
// e4 = Could not transfer WETH to Pair (fn_swapCall)
// e5 = Could not transfer WETH to Owner (fn_swapCall)

contract ArbitrageFlashSwap {
    address private owner;
    IWETH immutable WETH;

    constructor(){
        owner = msg.sender;
        WETH = IWETH(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c);
    }

    receive() external payable {}

    event LogFlashSwap(address token0, address token1, address routerA, address routerB, address routerC, uint profit);

    function execute(
        address _token0, address _token1, uint _amountIn,
        address _borrowPair, address _routerA, address _routerB, address _routerC
    ) public payable {
        if (msg.sender == owner) {
            // Check if the pair contains token0
            IPancakePair pair = IPancakePair(_borrowPair);
            require(pair.token0() == _token0 || pair.token1() == _token0, "e1");

            // Trigger flash swap and pass variables
            pair.swap(
                _token0 == pair.token0() ? _amountIn : 0,
                _token0 == pair.token1() ? _amountIn : 0,
                address(this),
                abi.encode(_token0, _token1, _amountIn, _routerA, _routerB, _routerC)
            );
        }
    }

    function swapCall(bytes calldata _data) private {
        // Function caller has to be a Pair and not some person
        require(address(IPancakePair(msg.sender)) == msg.sender, "e2");

        // Extract variables from _data
        (address token0, address token1, uint amountIn, address routerA, address routerB, address routerC) = abi.decode(_data, (address, address, uint, address, address, address));

        // Create path arrays for the 2 swaps
        address[] memory path0 = new address[](2);
        address[] memory path1 = new address[](2);
        path0[0] = path1[1] = token0;
        path0[1] = path1[0] = token1;

        // First swap (token0 --> token1)
        IERC20(token0).approve(routerA, amountIn);
        uint amountOut0 = IPancakeRouter02(routerA).swapExactTokensForTokens(amountIn, 0, path0, address(this), block.timestamp + 30)[1];

        // Second swap (token1 --> token)
        IERC20(token1).approve(routerB, amountOut0);
        uint amountOut1 = IPancakeRouter02(routerB).swapExactTokensForTokens(amountOut0, 0, path1, address(this), block.timestamp + 30)[1];

        uint amountToRepay = amountIn + (((amountIn * 3) / 997) + 1);
        require(amountToRepay < amountOut1, "e3");
        uint profit = amountOut1 - amountToRepay;

        // Optimistically set profitWETH to profit (don't know if token0 is WETH)
        uint profitWETH = profit;
        if (token0 != address(WETH)) {
            // Repay loan in token0
            IERC20(token0).transfer(msg.sender, amountToRepay);

            // Swap token0 to WETH
            IERC20(token0).approve(routerC, profit);
            path0[1] = address(WETH);

            // Set profit to WETH value
            profitWETH = IPancakeRouter02(routerC).swapExactTokensForETH(profit, 0, path0, owner, block.timestamp + 30)[1];
        } else {
            // Repay loan in WETH
            WETH.deposit{value: amountToRepay}();
            require(WETH.transfer(msg.sender, amountToRepay), "e4");
        }

        // Transfer profit in WETH to contract's owner
        (bool success,) = owner.call{value: profitWETH}(new bytes(0));
        require(success, "e5");

        // Emit an Event for tracking purposes
        emit LogFlashSwap(token0, token1, routerA, routerB, routerC, profitWETH);
    }

    function pancakeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external {
        swapCall(_data);
    }

    function BiswapCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external {
        swapCall(_data);
    }
}
