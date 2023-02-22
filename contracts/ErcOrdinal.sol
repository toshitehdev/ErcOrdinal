//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

contract ErcOrdinal {
    uint256 genesis_supply = 50;
    uint256 MAX_SUPPLY = 100000;
    uint256 public max_transfer = 11;
    uint256 mint_price = 49000000000000000;
    string token_name = "ErcOrdinal";
    string token_symbol = "ERCORD";
    uint8 token_decimals = 0;
    address public the_creator;
    uint256[] public token_ids;
    mapping(address => mapping(address => uint256)) spender_allowance;
    mapping(uint256 => Tokens) public idToTokens;
    mapping(address => uint256[]) private addressToTokenIds;
    mapping(address => mapping(uint256 => TokenIndex)) private idToTokenIndex;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    /**
     * @dev TokenIndex is needed to track index of ID's inserted.
     * Index started from 1
     * because every index (even the non-existing one) is default to 0.
     * @notice this index is different from addressToTokenIds
     * which started from 0, normal array
     */
    struct TokenIndex {
        uint256 index;
    }
    struct Tokens {
        uint256 id;
        string name;
        string file_uri;
        address owner;
        // string rarity;
    }
    modifier onlyCreator() {
        require(
            msg.sender == the_creator,
            "Only The Creator is Able to Do That"
        );
        _;
    }

    constructor() {
        the_creator = msg.sender;
        genesis();
        emit Transfer(address(0), the_creator, genesis_supply);
    }

    //function for testing purpose -->
    function changeMaxSupply(uint256 _maxSupply) public {
        MAX_SUPPLY = _maxSupply;
    }

    function changeMintPrice(uint256 _price) public {
        mint_price = _price;
    }

    //function for testing purpose <--

    function get_ids_length() public view returns (uint256) {
        return token_ids.length;
    }

    // ERC20 standard implementation -->
    function name() public view returns (string memory) {
        return token_name;
    }

    function symbol() public view returns (string memory) {
        return token_symbol;
    }

    function totalSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }

    function decimals() public view returns (uint256) {
        return token_decimals;
    }

    function balanceOf(address _owner) public view returns (uint256) {
        return addressToTokenIds[_owner].length;
    }

    function transfer(
        address _recipient,
        uint256 _amount
    ) public returns (bool) {
        transferBulk(msg.sender, _recipient, _amount);
        return true;
    }

    function approve(address _spender, uint256 _amount) public returns (bool) {
        spender_allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function allowance(
        address _owner,
        address _spender
    ) public view returns (uint256) {
        return spender_allowance[_owner][_spender];
    }

    function transferFrom(
        address _sender,
        address _recipient,
        uint256 _amount
    ) public returns (bool) {
        require(
            spender_allowance[_sender][msg.sender] >= _amount,
            "Not enough allowance"
        );
        transferBulk(_sender, _recipient, _amount);
        spender_allowance[_sender][msg.sender] -= _amount;
        return true;
    }

    // ERC20 standard implementation <--

    function changeMaxTransfer(uint256 _amount) public onlyCreator {
        max_transfer = _amount;
    }

    //assign 10 tokens or 1,000 maybe? the genesis, to first ten struct array
    function genesis() private {
        //genesis 0 for the creator
        token_ids.push(0);
        idToTokens[0] = Tokens({
            id: 0,
            name: "i am the creator",
            file_uri: "ipfs://genesis-file",
            owner: the_creator
        });
        addressToTokenIds[the_creator].push(0);
        idToTokenIndex[the_creator][0].index = 0;
        for (uint256 i = 1; i < genesis_supply; i++) {
            //ID started from 1
            token_ids.push(i);
            idToTokens[i] = Tokens({
                id: i,
                name: "mythic",
                file_uri: "ipfs://mythic-uri",
                owner: the_creator
            });
            addressToTokenIds[the_creator].push(i);
            idToTokenIndex[the_creator][i].index = i;
        }
    }

    function getAddressToIds(
        address _owner
    ) public view returns (uint256[] memory) {
        return addressToTokenIds[_owner];
    }

    function getIdToIndex(
        address _owner,
        uint256 _token_id
    ) public view returns (TokenIndex memory) {
        return idToTokenIndex[_owner][_token_id];
    }

    //rest of the supply can be minted
    function mint(string memory _name, string memory _file_uri) public payable {
        //require : mint indexed must be less than max supply
        require(token_ids.length < MAX_SUPPLY, "Max supply reached");
        require(msg.value > mint_price, "Not enough ETH");
        idToTokens[token_ids.length] = Tokens({
            id: token_ids.length,
            name: _name,
            file_uri: _file_uri,
            owner: msg.sender
        });
        idToTokenIndex[msg.sender][token_ids.length].index =
            addressToTokenIds[msg.sender].length +
            1;
        addressToTokenIds[msg.sender].push(token_ids.length);
        token_ids.push(token_ids.length);
    }

    function withdrawMintSale() public onlyCreator {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "failed");
    }

    //SWAP single token to ERC721 compliant, a.k.a NFT

    /**
     * @notice max_transfer is maximum transfer allowed + 1
     * if your maximum transfer allowed is 10, max_transfer = 11
     * @dev reason max_transfer being maximum allowed +1
     * is to avoid using <= operator, to save some gas
     */
    function transferBulk(
        address _sender,
        address _recipient,
        uint256 _amount
    ) private {
        require(
            _amount <= addressToTokenIds[_sender].length,
            "Not enough balance"
        );
        require(_amount < max_transfer, "Reached max transfer cap");
        uint256 senderHoldingsLength = addressToTokenIds[_sender].length;
        for (uint256 i = 1; i < _amount + 1; i++) {
            uint256 idx = senderHoldingsLength - i;
            uint256 token_id = addressToTokenIds[_sender][idx];
            //add ids, this needs ids instead
            idToTokenIndex[_recipient][token_id].index =
                addressToTokenIds[_recipient].length +
                1;
            addressToTokenIds[_recipient].push(token_id);
            //change the tokens owner
            idToTokens[addressToTokenIds[_sender][idx]].owner = _recipient;
            //take out ids, no need to know the ids
            addressToTokenIds[_sender].pop();
            delete idToTokenIndex[_sender][token_id];
        }
        emit Transfer(_sender, _recipient, _amount);
    }

    //single transfer, implemented in the Dapp
    //this is to ensure some tokens wont get transferred via other transfer method
    //same idea from ordinals team (BTC ordinal), to keep important satoshis in separate wallet
    function transferSingle(address _recipient, uint256 _id) public {
        require(idToTokens[_id].owner == msg.sender, "Must be the owner");
        uint256 senderLastIndex = addressToTokenIds[msg.sender].length - 1;
        uint256 senderLastId = addressToTokenIds[msg.sender][senderLastIndex];
        //_id won't be duplicate
        //once sent, ownership changed
        idToTokenIndex[_recipient][_id].index =
            addressToTokenIds[_recipient].length +
            1;
        addressToTokenIds[_recipient].push(_id);
        //change the owner
        idToTokens[_id].owner = _recipient;
        //find the index position of _id
        uint256 indexToRemove = idToTokenIndex[msg.sender][_id].index;
        //move last id on the arrays
        uint256 idToMove = addressToTokenIds[msg.sender][senderLastIndex];
        addressToTokenIds[msg.sender][indexToRemove - 1] = idToMove;
        //update idTotokenIndex for sender
        idToTokenIndex[msg.sender][senderLastId].index = indexToRemove;
        delete idToTokenIndex[msg.sender][_id];
        addressToTokenIds[msg.sender].pop();
    }
}
