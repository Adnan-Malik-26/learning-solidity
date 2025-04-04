// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import {SimpleStorage} from "./SimpleStorage.sol";

contract AddFiveStorage is SimpleStorage{
    //override and virtual

    function store(uint256 _newNumber) override public {
        myfavouriteNumber = _newNumber+5;
    }
}
