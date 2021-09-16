// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.5.0;

//import "./interfaces/IPancakeFactory.sol";
//import "./interfaces/IPancakePair.sol";

contract TestSwapContract {
    address private constant FACTORY = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;

    event Log(string message, uint value);

    uint temp = 0;

    function set(uint _data) public payable {
        temp = _data;
        emit Log("Value set:", temp);
    }

    function get() public view returns (uint){
        return temp;
    }

    function swap(string memory something) public {
        //address pair = IPancakeFactory(FACTORY).getPair(token0, token1);
        //uint amount0Out = token0 == IPancakePair(pair).token0() ? amount0 : 0;
        //uint amount1Out = token0 == IPancakePair(pair).token1() ? amount0 : 0;
        emit Log("amount0Out", 1);
        emit Log("amount1Out", 2);
        emit Log(something, 3);
    }
}
