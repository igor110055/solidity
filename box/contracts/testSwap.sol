// SPDX-License-Identifier: UNLICENSED

import "../dependencies/interfaces/IPancakeRouter02.sol";
import "../dependencies/interfaces/IPancakeFactory.sol";
import "../dependencies/interfaces/IPancakeCallee.sol";
import "../dependencies/interfaces/IPancakePair.sol";
import "../dependencies/interfaces/IERC20.sol";
import "../dependencies/interfaces/IWETH.sol";

pragma solidity ^0.8.0;

contract TestSwapContract is IPancakeCallee {
    IPancakeFactory immutable FACTORY;
    IPancakeRouter02 immutable ROUTER;
    IWETH immutable WETH;

    constructor() {
        address factory = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
        address router = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
        FACTORY = IPancakeFactory(factory);
        ROUTER = IPancakeRouter02(router);
        WETH = IWETH(IPancakeRouter02(router).WETH());
    }
    receive() external payable {}
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
    //        IPancakePair(pair).swap(amount0Out, amount1Out, address(this), null);
    //    }

    function execute(address _token0, address _token1, uint _amount, string[] memory _providerPath) public payable {
        require(_token0 == address(WETH) || _token1 == address(WETH), "No ETH token given");
        address pair = FACTORY.getPair(_token0, _token1);
        require(pair != address(0), "Pair does not exist");

        uint amount0Out = _token0 == IPancakePair(pair).token0() ? _amount : 0;
        uint amount1Out = _token0 == IPancakePair(pair).token1() ? _amount : 0;
        emit Log("amount0Out", amount0Out);
        emit Log("amount1Out", amount1Out);
        bytes memory data = abi.encode(_token0, _token1, _amount, _providerPath);
//        pancakeCall2(address(this), amount0Out, amount1Out, data);
        IPancakePair(pair).swap(amount0Out, amount1Out, address(this), data);
    }

    function pancakeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
        (address token0, address token1, uint amount, string[] memory providerPath) = abi.decode(_data, (address, address, uint, string[]));
        address pair = FACTORY.getPair(token0, token1);
        //require(pair == msg.sender, "Function sender is not a pair"); UNCOMMENT AFTERWARDS
        uint fee = ((amount * 3) / 997) + 1;
        uint amountToRepay = amount + fee;

        //        address token0 = IPancakePair(msg.sender).token0();
        //        address token1 = IPancakePair(msg.sender).token1();

//        WETH.deposit{value : amountToRepay}();
//        require(WETH.transfer(msg.sender, amountToRepay), "WETH transfer failed");
        IERC20(token0).transfer(pair, amountToRepay);
        emit Log("Success", 42);
    }

//    function pancakeCall(address sender, uint amount0, uint amount1, bytes calldata data) external override {
//
//    }
}
