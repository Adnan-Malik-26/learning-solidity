// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract SimpleStorage {
    uint256 public myfavouriteNumber;

    mapping(string => uint256) public nameToFavouriteNumber;
    
    function store(uint256 _favouriteNumber)public virtual {
        myfavouriteNumber=_favouriteNumber;
    }
    
    function retrieve() public view returns(uint256){
        return myfavouriteNumber;
    }

    function storeWithPayment(uint256 _favouriteNumber) public payable {
        require(msg.value > 0, "Must send some ETH");
        myfavouriteNumber = _favouriteNumber;
    }
}
