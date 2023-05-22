// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.18;

interface IOracle {

    /**
     * return amount of tokens that are required to receive that much eth.
     */
    function getTokenValueOfEth(uint256 ethOutput) external view returns (uint256 tokenInput);
}

contract TestOracle is IOracle {

    uint public price;

    constructor(uint _price){
        price = _price;
    }

    function getTokenValueOfEth(uint256 ethOutput) external view override returns (uint256 tokenInput) {
        return ethOutput * price;
    }
}
