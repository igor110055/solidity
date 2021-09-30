// SPDX-License-Identifier: UNLICENSED

import "../dependencies/interfaces/Pancake/IPancakeRouter01.sol";
import "../dependencies/interfaces/Pancake/IPancakeRouter02.sol";
import "../dependencies/interfaces/Pancake/IPancakeFactory.sol";
import "../dependencies/interfaces/Pancake/IPancakeCallee.sol";
import "../dependencies/interfaces/Pancake/IPancakePair.sol";

import "../dependencies/interfaces/IERC20.sol";
import "../dependencies/interfaces/IWETH.sol";

pragma solidity ^0.8.0;

contract ArbitrageFlashSwap {
    address WETH = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    receive() external payable {}

    event LogFlashSwap(address token0, address token1, address exchangeA, address exchangeB, uint profit);
    event LogAddress(string message, address test);
    event LogNumber(string message, uint value);

    function execute(
        address _token0, address _token1, uint _amountIn,
        address _borrowPair, address _factoryA, address _factoryB, address _routerSell
    ) public payable {
        uint amount0Out = _token0 == IPancakePair(_borrowPair).token0() ? _amountIn : 0;
        uint amount1Out = _token0 == IPancakePair(_borrowPair).token1() ? _amountIn : 0;

        emit LogNumber("amount0Out", amount0Out);
        emit LogNumber("amount1Out", amount1Out);

        IPancakePair(_borrowPair).swap(
            amount0Out, amount1Out, address(this),
            abi.encode(_token0, _token1, _amountIn, _factoryA, _factoryB, _routerSell)
        );
    }

//    function swapCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) private {
    function swapCall(address token0, address token1, uint amountIn, address routerA, address routerB) public {
//        (address token0, address token1, uint amountIn, address factoryA, address factoryB, address routerSell) = abi.decode(_data, (address, address, uint, address, address, address));
        // require(pair == msg.sender, "Function sender is not a pair"); UNCOMMENT AFTERWARDS

//        emit LogAddress("_sender", _sender);
//        emit LogNumber("_amount0", _amount0);
//        emit LogNumber("_amount1", _amount1);

        emit LogAddress("token0", token0);
        emit LogAddress("token1", token1);
        emit LogNumber("amountIn", amountIn);
        emit LogAddress("routerA", routerA);
        emit LogAddress("routerB", routerB);
//        emit LogAddress("routerSell", routerSell);

        uint amountOut0;
        uint amountOut1;

        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;

        IPancakeRouter02(routerB).swapExactETHForTokens{value : amountIn}(0, path, address(this), block.timestamp + 60);
        emit LogNumber("amountOut0", amountOut0);
        //        if (token0 == WETH)
//            amountOut0 = IPancakeRouter02(routerA).swapExactETHForTokens{value : amountIn}(0, path, address(this), block.timestamp + 60)[1];
//        else
//            if (token1 == WETH)
//                amountOut0 = IPancakeRouter02(routerA).swapExactTokensForETH(amountIn, 0, path, address(this), block.timestamp + 60)[1];
//            else
//                amountOut0 = IPancakeRouter02(routerA).swapExactTokensForTokens(amountIn, 0, path, address(this), block.timestamp + 60)[1];

        path[0] = token1;
        path[1] = token0;
//
//        if (token1 == WETH)
//            amountOut1 = IPancakeRouter02(factoryB).swapExactETHForTokens{value : amountOut0}(0, path, address(this), block.timestamp + 60)[1];
//        else
//            if (token0 == WETH)
//                amountOut1 = IPancakeRouter02(factoryB).swapExactTokensForETH(amountIn, 0, path, address(this), block.timestamp + 60)[1];
//            else
//                amountOut1 = IPancakeRouter02(factoryB).swapExactTokensForTokens(amountIn, 0, path, address(this), block.timestamp + 60)[1];
//
//        emit LogNumber("amountOut0", amountOut0);
//        emit LogNumber("amountOut1", amountOut1);
//
//        uint fee = ((amountIn * 3) / 997) + 1;
//        uint amountToRepay = amountIn + fee;
//
//        require(amountToRepay < amountOut1, "Did not make profit!");
//
//        if (token0 == WETH) {
//            IWETH(WETH).deposit{value : amountToRepay}();
//            IWETH(WETH).transfer(msg.sender, amountToRepay);
//        } else {
//            IERC20(token0).transfer(msg.sender, amountToRepay);
//        }
        emit LogNumber("Success", 42);
    }

    function pancakeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external {
//        swapCall(_sender, _amount0, _amount1, _data);
    }

    function BiswapCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external {
//        swapCall(_sender, _amount0, _amount1, _data);
    }
}
