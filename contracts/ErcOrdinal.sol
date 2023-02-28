//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

contract ErcOrdinal {
    uint256 genesis_supply = 12;
    uint256 MAX_SUPPLY = 100000;
    uint256 public max_transfer = 11;
    uint256 mint_price = 20000000000000000;
    string token_name = "ErcOrdinal";
    string token_symbol = "ERCORD";
    uint8 token_decimals = 0;
    address public the_creator;
    uint256 public token_counter = 0;
    mapping(address => mapping(address => uint256)) spender_allowance;
    mapping(uint256 => Tokens) public idToTokens;
    mapping(address => uint256[]) private addressToTokenIds;
    mapping(address => mapping(uint256 => TokenIndex)) private idToTokenIndex;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed _to, uint256 indexed _id);
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

    // ERC20 standard implementation -->
    function getGenesisSupply() public view returns (uint256) {
        return genesis_supply;
    }

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
        // is this Uniswap self transfer?
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
        token_counter += 1;
        idToTokens[0] = Tokens({id: 0, owner: the_creator});
        addressToTokenIds[the_creator].push(0);
        idToTokenIndex[the_creator][0].index = 1;
        for (uint256 i = 1; i < genesis_supply; i++) {
            //ID started from 1
            idToTokens[i] = Tokens({id: i, owner: the_creator});
            addressToTokenIds[the_creator].push(i);
            idToTokenIndex[the_creator][i].index = i + 1;
            token_counter = token_counter + 1;
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

    function getIdToTokens(uint256 _id) public view returns (address) {
        return idToTokens[_id].owner;
    }

    //rest of the supply can be minted
    function mint() external payable {
        //require : mint indexed must be less than max supply
        require(token_counter < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mint_price, "Not enough ETH");
        idToTokens[token_counter] = Tokens({
            id: token_counter,
            owner: msg.sender
        });
        idToTokenIndex[msg.sender][token_counter].index =
            addressToTokenIds[msg.sender].length +
            1;
        addressToTokenIds[msg.sender].push(token_counter);
        token_counter += 1;
        emit Mint(msg.sender, token_counter);
    }

    function mintMany(uint256 _amount) external payable {
        require(token_counter < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mint_price * _amount, "Not enough ETH");
        require(_amount > 0, "Can't mint zero amount");
        //length = 13
        for (uint256 i = 0; i < _amount; i++) {
            idToTokens[token_counter] = Tokens({
                id: token_counter,
                owner: msg.sender
            });
            idToTokenIndex[msg.sender][token_counter].index =
                addressToTokenIds[msg.sender].length +
                1;
            addressToTokenIds[msg.sender].push(token_counter);
            token_counter += _amount;
            emit Mint(msg.sender, token_counter);
        }
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
        require(_sender != _recipient, "Self transfer not allowed");
        require(_amount < max_transfer, "Reached max transfer cap");
        uint256 senderHoldingsLength = addressToTokenIds[_sender].length;
        uint256 recipientLength = addressToTokenIds[_recipient].length;
        if (recipientLength < 1) {
            for (uint256 i = 1; i < _amount + 1; i++) {
                uint256 senderLastTokenIndex = senderHoldingsLength - i;
                uint256 senderLastTokenId = addressToTokenIds[_sender][
                    senderLastTokenIndex
                ];
                idToTokenIndex[_recipient][senderLastTokenId].index = i;
                addressToTokenIds[_recipient].push(senderLastTokenId);
                //change the tokens owner
                idToTokens[senderLastTokenId].owner = _recipient;
                //take out ids, no need to know the ids
                addressToTokenIds[_sender].pop();
                delete idToTokenIndex[_sender][senderLastTokenId];
            }

            emit Transfer(_sender, _recipient, _amount);
        } else {
            for (uint256 i = 1; i < _amount + 1; i++) {
                uint256 senderLastTokenIndex = senderHoldingsLength - i;
                uint256 senderLastTokenId = addressToTokenIds[_sender][
                    senderLastTokenIndex
                ];
                uint256 idToMove = addressToTokenIds[_recipient][i - 1];
                //add ids, this needs ids instead
                idToTokenIndex[_recipient][idToMove].index =
                    recipientLength +
                    i;
                addressToTokenIds[_recipient].push(idToMove);
                idToTokenIndex[_recipient][senderLastTokenId].index = i;
                addressToTokenIds[_recipient][i - 1] = senderLastTokenId;

                //change the tokens owner
                idToTokens[senderLastTokenId].owner = _recipient;
                //take out ids, no need to know the ids
                addressToTokenIds[_sender].pop();
                delete idToTokenIndex[_sender][senderLastTokenId];
            }
            emit Transfer(_sender, _recipient, _amount);
        }
    }

    function transferMany(address _recipient, uint256[] memory _ids) public {
        require(_recipient != msg.sender, "Self transfer not allowed");
        require(
            _ids.length <= addressToTokenIds[msg.sender].length,
            "Not enough balance"
        );
        for (uint256 i = 0; i < _ids.length; i++) {
            transferSingle(_recipient, _ids[i]);
        }
    }

    //single transfer, implemented in the Dapp
    //this is to ensure some tokens wont get transferred via other transfer method
    //same idea from ordinals team (BTC ordinal), to keep important satoshis in separate wallet
    function transferSingle(address _recipient, uint256 _id) public {
        require(_recipient != msg.sender, "Self transfer not allowed");
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
