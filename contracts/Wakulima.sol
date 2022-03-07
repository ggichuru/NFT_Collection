// SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract Wakulima is ERC721Enumerable, Ownable {
    /**
     * @dev _baseTokenURI for computing {tokenURI}.
     *        If set, the resulting uri for each token willl be the concatenation of the baseURI and tokenId
     */

    string _baseTokenURI;

    uint256 public _price = 0.01 ether; // price of one nft

    bool public _paused; // used to pause contract incase of an emergency

    uint256 public maxTokenIds = 20;

    uint256 public tokenIds; //total number of minted token ids

    IWhitelist whitelist;

    bool public presaleStarted;

    uint256 public presaleEnded; //timestamp when presale ended

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    /**
    @dev ERC721 takes in a name and a symbol
    @param baseURI to set the base uri of the token
    @param whitelistContract initialize an instance of the whitelist contract
     */

    constructor(string memory baseURI, address whitelistContract)
        ERC721("Wakulima", "WM")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    /** @dev allow user to mint 1 NFT /tx during presale */
    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale is not running"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You are not whitelisted"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum token supply");
        require(msg.value >= _price, "insufficient amount");
        tokenIds += 1;

        /* _safeMint is a safer version of the _mint function as it ensures that
           - if the address being minted to is a contract, then it knows how to deal with ERC721 tokens
           - If the address being minted to is not a contract, it works the same way as _mint
        */
        _safeMint(msg.sender, tokenIds);
    }

    /** @dev allow user to mint 1 NFT /tx after presale has ended */
    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum token supply");
        require(msg.value >= _price, "insufficient amount");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /** @dev overrides the Openzeppelins ERC721 implementation which returns an empty string for base url */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    /** @dev sends all the ether in the contract to the owner of the contract */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // function to receive ether  [msg.data must be empty]
    receive() external payable {}

    // fallback function is called when msg.data is not empty
    fallback() external payable {}
}
