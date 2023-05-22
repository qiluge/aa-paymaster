// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor (string memory name, string memory symbol)
        // solhint-disable-next-line no-empty-blocks
    ERC20(name, symbol) {
        _mint(msg.sender, 10000000000 * (10 ** 18));
    }

    function mint(address sender, uint256 amount) external {
        _mint(sender, amount);
    }
}
