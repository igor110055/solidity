// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.0;

import "../dependencies/interfaces/IPancakeFactory.sol";
import "../dependencies/interfaces/IPancakeRouter02.sol";
import "../dependencies/interfaces/IPancakePair.sol";
import "../dependencies/interfaces/IERC20.sol";

contract TestSwapContract {
    address private constant FACTORY = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
    address private constant ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    event Log(string message, uint value);

    uint temp = 0;

    function set(uint _data) public payable {
        temp = _data;
        emit Log("Value set: ", temp);
    }

    function get() public view returns (uint){
        return temp;
    }

    event Test(address asd);
    function swap(address[] memory path, uint _amount0) public payable {
        emit Log("amount", _amount0);
        IERC20(path[0]).transferFrom(msg.sender, address(this), _amount0);
//        IPancakeRouter02(ROUTER).swapExactTokensForTokens(_amount0, 0, path, address(this), block.timestamp);
        emit Log("Swap Successful", 42);
//        address pair = IPancakeFactory(FACTORY).getPair(_token0, _token1);
//        require(pair != address(0), "Pair does not exist");
//        uint amount0Out = _token0 == IPancakePair(pair).token0() ? _amount : 0;
//        uint amount1Out = _token0 == IPancakePair(pair).token1() ? _amount : 0;
//        IPancakePair(pair).swap(amount0Out, amount1Out, address(this), null);
    }
}
