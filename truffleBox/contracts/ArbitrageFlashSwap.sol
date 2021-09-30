// SPDX-License-Identifier: UNLICENSED

import "../dependencies/interfaces/Biswap/IBiswapRouter02.sol";
import "../dependencies/interfaces/Biswap/IBiswapFactory.sol";
import "../dependencies/interfaces/Biswap/IBiswapCallee.sol";
import "../dependencies/interfaces/Biswap/IBiswapERC20.sol";
import "../dependencies/interfaces/Biswap/IBiswapPair.sol";

import "../dependencies/interfaces/Pancake/v1/IPancakeRouter01.sol";
import "../dependencies/interfaces/Pancake/v2/IPancakeRouter02.sol";
import "../dependencies/interfaces/Pancake/IPancakeFactory.sol";
import "../dependencies/interfaces/Pancake/IPancakeCallee.sol";
import "../dependencies/interfaces/Pancake/IPancakePair.sol";


import "../dependencies/interfaces/IERC20.sol";
import "../dependencies/interfaces/IWETH.sol";

pragma solidity ^0.8.0;

contract TestSwapContract is IPancakeCallee, IBiswapCallee {
    IBiswapFactory immutable biswapFactory;
    IBiswapRouter02 immutable biswapRouterV2;

    IPancakeFactory immutable pancakeFactoryV1;
    IPancakeRouter01 immutable pancakeRouterV1;

    IPancakeFactory immutable pancakeFactoryV2;
    IPancakeRouter02 immutable pancakeRouterV2;

    IWETH immutable WETH;

    constructor() {
        biswapFactory = IBiswapFactory(0x858E3312ed3A876947EA49d572A7C42DE08af7EE);
        biswapRouterV2 = IBiswapRouter02(0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8);

        pancakeFactoryV1 = IPancakeFactory(0xBCfCcbde45cE874adCB698cC183deBcF17952812);
        pancakeRouterV1 = IPancakeRouter01(0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F);

        pancakeFactoryV2 = IPancakeFactory(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);
        pancakeRouterV2 = IPancakeRouter02(0x10ED43C718714eb63d5aA57B78B54704E256024E);

        WETH = IWETH(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c);
    }

    receive() external payable {}

    event FlashSwap(address token0, address token1, address exchangeA, address exchangeB, uint profit);
    event Test(address test);
    event Log(string message, uint value);

    //    function swap(address[] memory path, uint _amount0) public payable {
    //        emit Log("amount", _amount0);
    //        IERC20(path[0]).transferFrom(msg.sender, address(this), _amount0);
    //        IPancakeRouter02(ROUTER).swapExactTokensForTokens(_amount0, 0, path, address(this), block.timestamp);
    //        emit Log("Swap Successful", 42);
    //        address pair = IPancakeFactory(FACTORY).getPair(_token0, _token1);
    //        require(pair != address(0), "Pair does not exist");
    //        uint amount0Out = _token0 == IPancakePair(pair).token0() ? _amount : 0;
    //        uint amount1Out = _token0 == IPancakePair(pair).token1() ? _amount : 0;
    //        IPancakePair(pair).swap(amount0Out, amount1Out, address(this), new bytes(0));
    //    }

    function execute(
        address _token0, address _token1, uint _amountIn,
        address _borrowAtPair, uint _borrowAt,
        uint _factoryA, uint _factoryB, uint _sellAt
    ) public payable {
        require(- 1 < _borrowAt < 3);
        require(- 1 < exchangeA < 3);
        require(- 1 < exchangeB < 3);

        if (_borrowAt == 0) IBiswapPair pair = IBiswapPair(_borrowAtPair);
        else if (_borrowAt == 1) IPancakePair pair = IPancakePair(_borrowAtPair);
        else if (_borrowAt == 2) IPancakePair pair = IPancakePair(_borrowAtPair);

        require(address(pair) != address(0), "Pair does not exist");

        uint amount0Out = _token0 == pair.token0() ? _amountIn : 0;
        uint amount1Out = _token0 == pair.token1() ? _amountIn : 0;
        emit Log("amount0Out", amount0Out);
        emit Log("amount1Out", amount1Out);

        bytes memory data = abi.encode(_token0, _token1, _amountIn, _factoryA, _factoryB, _sellAt);
        pair.swap(amount0Out, amount1Out, address(this), data);
    }

    function swapCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data){
        (address token0, address token1, uint amountIn, uint exchangeAIndex, uint exchangeBIndex) = abi.decode(_data, (address, address, uint, uint, uint));

        if (exchangeAIndex == 0) IBiswapFactory factoryA = biswapFactory;
        else if (exchangeAIndex == 1) IPancakeFactory factoryA = pancakeFactoryV1;
        else if (exchangeAIndex == 2) IPancakeFactory factoryA = pancakeFactoryV2;

        if (exchangeBIndex == 0) IBiswapFactory factoryB = biswapFactory;
        else if (exchangeBIndex == 1) IPancakeFactory factoryB = pancakeFactoryV1;
        else if (exchangeBIndex == 2) IPancakeFactory factoryB = pancakeFactoryV2;

        address firstPair = factoryA.getPair(token0, token1);
        //require(pair == msg.sender, "Function sender is not a pair"); UNCOMMENT AFTERWARDS


        uint fee = ((amountIn * 3) / 997) + 1;
        uint amountToRepay = amount + fee;

        //        address token0 = IPancakePair(msg.sender).token0();
        //        address token1 = IPancakePair(msg.sender).token1();

        //        WETH.deposit{value : amountToRepay}();
        //        require(WETH.transfer(msg.sender, amountToRepay), "WETH transfer failed");
        IERC20(token0).transfer(pair, amountToRepay);
        emit Log("Success", 42);
    }

    function pancakeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
        swapCall(_sender, _amount0, _amount1, _data);
    }

    function BiswapCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
        swapCall(_sender, _amount0, _amount1, _data);
    }
}
