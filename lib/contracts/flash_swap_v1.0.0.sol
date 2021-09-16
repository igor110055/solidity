// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.5;

import "./imports/IPancakeCallee.sol";
import "./imports/IPancakeFactory.sol";
import "./imports/IPancakePair.sol";
import "./imports/IERC20.sol";


contract TestFlashSwap is IPancakeCallee {
    address private constant FACTORY = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
    address private constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    event Log(string message, uint256 val);

    function testFlashSwap(address _tokenBorrow, uint _amount) external {
        emit Log("test", 1);
        address pair = IPancakeFactory(FACTORY).getPair(_tokenBorrow, WBNB);
        emit Log("test2", 2);
        require(pair != address(0), "!pair");

        address token0 = IPancakePair(pair).token0();
        address token1 = IPancakePair(pair).token1();
        uint amount0Out = _tokenBorrow == token0 ? _amount : 0;
        uint amount1Out = _tokenBorrow == token1 ? _amount : 0;

        bytes memory data = abi.encode(_tokenBorrow, _amount);
        IPancakePair(pair).swap(amount0Out, amount1Out, address(this), data);
    }

    function pancakeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
        emit Log("asdf", 69);
        address token0 = IPancakePair(msg.sender).token0();
        address token1 = IPancakePair(msg.sender).token1();
        address pair = IPancakeFactory(FACTORY).getPair(token0, token1);
        require(msg.sender == pair, "!pair");
        require(_sender == address(this), "!sender");
        (address tokenBorrow, uint amount) = abi.decode(_data, (address, uint));

        // about 0.3%
        uint fee = ((amount * 3) / 997) + 1;
        uint amountToRepay = amount + fee;

        // do stuff here
        emit Log("amount", amount);
        emit Log("amount0", _amount0);
        emit Log("amount1", _amount1);
        emit Log("fee", fee);
        emit Log("amount to repay", amountToRepay);

        IERC20(tokenBorrow).transfer(msg.sender, amountToRepay);
    }
}