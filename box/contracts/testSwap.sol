pragma solidity ^0.5.0;

import "./interfaces/IPancakeFactory.sol";
import "./interfaces/IPancakePair.sol";

contract TestSwapContract {
    address private FACTORY;

    event Log(string message, uint value);

    constructor(address factoryAddress) public {
        emit Log("Constructor called", 1);
        FACTORY = factoryAddress;
    }

    function swap(address token0, address token1, uint amount0) public {
        address pair = IPancakeFactory(FACTORY).getPair(token0, token1);
        uint amount0Out = token0 == IPancakePair(pair).token0() ? amount0 : 0;
        uint amount1Out = token0 == IPancakePair(pair).token1() ? amount0 : 0;
        emit Log("amount0Out", amount0Out);
        emit Log("amount1Out", amount1Out);
    }
}
