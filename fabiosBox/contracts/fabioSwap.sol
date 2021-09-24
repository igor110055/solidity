// SPDX-License-Identifier: UNLICENSED

//import "../dependencies/interfaces/IPancakeRouter02.sol";
//import "../dependencies/interfaces/IPancakeFactory.sol";
//import "../dependencies/interfaces/IPancakeCallee.sol";
//import "../dependencies/interfaces/IPancakePair.sol";
//import "../dependencies/interfaces/IERC20.sol";
//import "../dependencies/interfaces/IWETH.sol";

pragma solidity ^0.8.0;


import "../dependencies/interfaces/IApeCallee.sol";
import "../dependencies/interfaces/IApeFactory.sol";
import "../dependencies/interfaces/IApePair.sol";

contract TestSwapContract is IApeCallee {
//    IPancakeFactory immutable FACTORY;
//    IPancakeRouter02 immutable ROUTER;
//    IWETH immutable WETH;
    IApeFactory immutable FACTORY;


    constructor() {
        address factory = 0xCf083Be4164828f00cAE704EC15a36D711491284;
        address router = 0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607;
        FACTORY = IApeFactory(factory);
//        ROUTER = IPancakeRouter02(router);
//        WETH = IWETH(IPancakeRouter02(router).WETH());
    }
    receive() external payable {}
    event Test(address test);
    event Log(string message, uint value);


    function execute(address _token0, address _token1, uint _amount, string[] memory_providerPath) public payable {
        address pair = FACTORY.getPair(_token0, _token1);
        require(pair != address(0), "Pair does not exist");

        uint amount0Out = _token0 == IApePair(pair).token0() ? _amount : 0;
        uint amount1Out = _token0 == IApePair(pair).token1() ? _amount : 0;
        emit Log("amount0Out", amount0Out);
        emit Log("amount1Out", amount1Out);
        bytes memory data = abi.encode(_token0, _token1, _amount, _providerPath);
        //        pancakeCall2(address(this), amount0Out, amount1Out, data);
        IApePair(pair).swap(amount0Out, amount1Out, address(this), data);
    }

    function apeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
        (address token0, address token1, uint amount, string[] memory providerPath) = abi.decode(_data, (address, address, uint, string[]));
        address pair = FACTORY.getPair(token0, token1);
        //require(pair == msg.sender, "Function sender is not a pair"); UNCOMMENT AFTERWARDS
        uint fee = ((amount * 3) / 997) + 1;
        uint amountToRepay = amount + fee;

        //        address token0 = IPancakePair(msg.sender).token0();
        //        address token1 = IPancakePair(msg.sender).token1();

        //        WETH.deposit{value : amountToRepay}();
        //        require(WETH.transfer(msg.sender, amountToRepay), "WETH transfer failed");
//        IERC20(token0).transfer(pair, amountToRepay);
        emit Log("Success", 42);
    }

}
