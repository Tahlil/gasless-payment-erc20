// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract UMToken is ERC20, Ownable, ERC20Permit {
    constructor() ERC20("UMToken", "um") ERC20Permit("UMToken") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}