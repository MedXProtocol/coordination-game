
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "./EtherPriceFeed.sol";
import "./Work.sol";
import "./TILRegistry.sol";
import "./IndexedBytes32Array.sol";

/**
 * @title The coordination game played to enter a [Token Incentivized List](https://medium.com/medxprotocol/a-tcr-protocol-design-for-objective-content-6abb04aac027)
 * @author Brendan Asselstine, Chuck Bergeron
 * @notice This contract allows two people to play a coordination game.  The game begins when one player
 * chooses a secret and commits the hash of the secret and a hint to the contract.  The second player needs to
 * use the hint to guess the secret.  Once the second player commits their guess, the first player reveals
 * their secret.  If they match then the contract calls the TIL to declare the game won.  Otherwise the game
 * is lost and the TIL is transferred all tokens and ether and notified.
*/
contract CoordinationGame is Ownable {
  using SafeMath for uint256;
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  struct Game {
    bytes32 applicationId;
    address applicant;
    bytes32 secretAndRandomHash;
    bytes32 randomHash;
    bytes hint;
    uint256 createdAt;
    uint256 updatedAt;
    uint256 applicationFeeWei;
    uint256 applicantTokenDeposit;
    uint256 randomBlockNumber;
    bytes32 applicantSecret;
    address whistleblower;
  }

  struct Verification {
    uint256 verifierSelectedAt;
    address verifier;
    bytes32 verifierSecret;
    uint256 verifierSubmittedAt;
    uint256 verifierChallengedAt;
    uint256 verifierDepositWei;
  }

  EtherPriceFeed etherPriceFeed;
  Work work;
  TILRegistry tilRegistry;

  uint256 public verifierTimeoutInSeconds;
  uint256 public applicantRevealTimeoutInSeconds;

  uint256 public applicationStakeAmount;
  uint256 public baseApplicationFeeUsdWei;

  mapping (address => IndexedBytes32Array.Data) applicantsApplicationIndices;
  mapping (address => IndexedBytes32Array.Data) verifiersApplicationIndices;

  IndexedBytes32Array.Data gamesIterator;
  mapping (bytes32 => Game) public games;
  mapping (bytes32 => Verification) public verifications;

  event NewApplication(
    bytes32 indexed applicationId,
    address indexed applicant,
    bytes32 secretAndRandomHash,
    bytes32 randomHash,
    bytes hint
  );

  event VerifierSelected(
    bytes32 indexed applicationId,
    address indexed applicant,
    address indexed verifier
  );

  event VerifierSubmissionTimedOut(
    bytes32 indexed applicationId,
    address indexed verifier
  );

  event VerifierSecretSubmitted(
    bytes32 indexed applicationId,
    address verifier,
    bytes32 secret
  );

  event VerifierChallenged(
    bytes32 indexed applicationId,
    address verifier
  );

  event ApplicantWon(
    bytes32 indexed applicationId
  );

  event ApplicantLost(
    bytes32 indexed applicationId
  );

  event SettingsUpdated(
    uint256 applicationStakeAmount,
    uint256 baseApplicationFeeUsdWei,
    uint256 verifierTimeoutInSeconds,
    uint256 applicantRevealTimeoutInSeconds
  );

  event Whistleblown(
    address whistleblower,
    bytes32 applicationId,
    uint256 randomNumber
  );

  modifier onlyApplicant(bytes32 _applicationId) {
    require(games[_applicationId].applicant == msg.sender, 'sender must be applicant');
    _;
  }

  modifier onlyVerifier(bytes32 _applicationId) {
    require(verifications[_applicationId].verifier == msg.sender, 'sender must be verifier');
    _;
  }

  modifier randomBlockWasMined(bytes32 _applicationId) {
    require(block.number >= games[_applicationId].randomBlockNumber, 'enough blocks have been mined');
    _;
  }

  modifier applicationStarted(bytes32 _applicationId) {
    require(games[_applicationId].secretAndRandomHash != bytes32(0), 'secretAndRandomHash is defined');
    _;
  }

  modifier onlyNewApplication(bytes32 _applicationId) {
    require(games[_applicationId].applicant == address(0), 'application has not been made before');
    _;
  }

  modifier secretNotRevealed(bytes32 _applicationId) {
    require(games[_applicationId].applicantSecret == bytes32(0), 'secret has not been revealed');
    _;
  }

  modifier notWhistleblown(bytes32 _applicationId) {
    require(games[_applicationId].whistleblower == address(0), 'no whistleblower');
    _;
  }

  /**
   * @notice Initializes a new CoordinationGame contract.
   * @param _owner The owner of the contract who will have special privileges
   * @param _etherPriceFeed The ether price feed oracle medianizer to use to calculate fees
   * @param _work the Work contract to select verifiers
   * @param _tilRegistry the Trustless Incentivized List Registry (TCR) contract
   * to add applicants to
   * @param _applicationStakeAmount how much an applicant has to stake when applying
   * @param _baseApplicationFeeUsdWei The fee for each application expressed in USD.  It will be used with the
   * _etherPriceFeed to calculate the actual amount of Ether that needs to be sent along with a new application.
  */
  function init (
    address _owner,
    EtherPriceFeed _etherPriceFeed,
    Work _work,
    TILRegistry _tilRegistry,
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei
  ) public initializer {
    require(_tilRegistry != address(0));
    require(_work != address(0));
    Ownable.initialize(_owner);
    etherPriceFeed = _etherPriceFeed;
    work = _work;
    tilRegistry = _tilRegistry;
    applicationStakeAmount = _applicationStakeAmount;
    baseApplicationFeeUsdWei = _baseApplicationFeeUsdWei;

    verifierTimeoutInSeconds = 345600; // 4 * 86400
    applicantRevealTimeoutInSeconds = 259200; // 3 * 86400
  }

  /**
   * @notice The owner can set the application stake amount, which is the number of tokens required as a
   * deposit for a new application.  Old applications will not be affected.
   * @param _applicationStakeAmount The new application stake amount.
   */
  function setApplicationStakeAmount(uint256 _applicationStakeAmount)
    public
    onlyOwner
  {
    require(_applicationStakeAmount > 0, 'applicationStakeAmount is greater then zero');

    applicationStakeAmount = _applicationStakeAmount;
  }

  /**
   * @notice Starts an application on behalf of the message sender.  Before calling, the sender should have
   * approved this contract to spend the application stake amount of tokens.  When calling this function the
   * sender must include the Ether deposit as well, which can be calculated by weiPerApplication().
   * @param _keccakOfSecretAndRandom The hash of the secret and salt
   * @param _keccakOfRandom The hash of the salt
   * @param _hint The hint the Applicant provided for the Verifier
  */
  function start(
    bytes32 _applicationId,
    bytes32 _keccakOfSecretAndRandom,
    bytes32 _keccakOfRandom,
    bytes _hint
  )
    external
    payable
    onlyNewApplication(_applicationId)
  {
    uint256 depositWei = weiPerApplication();
    require(msg.value >= depositWei, 'not enough ether');

    games[_applicationId] = Game(
      _applicationId,
      msg.sender, // applicant
      _keccakOfSecretAndRandom, // secretAndRandomHashes
      _keccakOfRandom, // randomHashes
      _hint, // hints
      block.timestamp, // createdAt
      block.timestamp, // updatedAt
      msg.value, // applicationBalancesInWei
      applicationStakeAmount, // applicantTokenDeposits
      block.number + 1, // randomBlockNumbers
      0, // applicantSecret
      0 // whistleblower
    );
    verifications[_applicationId] = Verification(
      0, // verifier
      0, // verifierSecret
      0, // verifierSelectedAt
      0, // verifierSubmittedAt
      0, // verifierChallengedAt
      0 // verifierDepositWei
    );
    gamesIterator.pushValue(_applicationId);
    applicantsApplicationIndices[msg.sender].pushValue(_applicationId);

    // Transfer a deposit of work tokens from the Applicant to this contract
    require(
      tilRegistry.token().transferFrom(msg.sender, address(this), games[_applicationId].applicantTokenDeposit),
      '2nd token transfer succeeded'
    );

    emit NewApplication(
      _applicationId,
      msg.sender,
      _keccakOfSecretAndRandom,
      _keccakOfRandom,
      _hint
    );
  }

  /**
   * @notice Called by the applicant when they wish to select the verifier.  This step must be done after
   * one block has been mined since starting the application.  The mined block hash is used as entropy to
   * select the verifier.  This function will fail if a verifier has already submitted their guess, or if the
   * deadline for a verifier to submit their guess is in the future.
   */
  function applicantRandomlySelectVerifier(bytes32 _applicationId)
    external
    onlyApplicant(_applicationId)
    randomBlockWasMined(_applicationId)
    notWhistleblown(_applicationId)
  {
    require(!verifierSubmittedSecret(_applicationId), "verifier has not submitted their secret");

    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    address previousVerifier = verification.verifier;
    uint256 randomNum = uint256(blockhash(game.randomBlockNumber));
    address selectedVerifier = selectVerifier(msg.sender, randomNum);

    if (previousVerifier != address(0)) {
      require(
        verifierSubmissionTimedOut(_applicationId),
        'verifier had their chance to submit their secret'
      );

      require(
        work.token().transfer(game.applicant, game.applicantTokenDeposit),
        'transferred old verifiers deposit to applicant'
      );

      emit VerifierSubmissionTimedOut(_applicationId, previousVerifier);

      verifiersApplicationIndices[previousVerifier].removeValue(_applicationId);

      // If we chose this verifier last time let's choose a different one
      if (selectedVerifier == previousVerifier) {
        selectedVerifier = selectVerifier(msg.sender, randomNum + 1);
      }

      require(selectedVerifier != previousVerifier, 'new verifier is not the same as the previous one');
    }

    require(selectedVerifier != msg.sender, 'verifier is not the applicant');
    require(selectedVerifier != address(0), 'verifier is not 0');

    verification.verifier = selectedVerifier;
    verification.verifierSelectedAt = block.timestamp;

    /// Update random block to be the next one
    game.randomBlockNumber = block.number + 1;
    game.updatedAt = block.timestamp;

    verifiersApplicationIndices[selectedVerifier].pushValue(_applicationId);

    // transfer tokens from verifier's stake in Work contract to here
    require(work.withdrawJobStake(selectedVerifier), 'transferred verifier tokens');

    emit VerifierSelected(
      _applicationId,
      msg.sender,
      selectedVerifier
    );
  }

  /**
   * @notice Selects a verifier from the Work contract
   * @dev Warning: this function does not take modulo bias into account!
   * @param _applicant The applicant who is selecting the worker
   * @param _randomNum The entropy used to select the worker
   */
  function selectVerifier(address _applicant, uint256 _randomNum) public view returns (address) {
    address selectedVerifier = work.selectWorker(_randomNum);
    uint256 workerOffset = 0;
    while (selectedVerifier == _applicant) {
      workerOffset += 1;
      selectedVerifier = work.selectWorker(_randomNum + workerOffset);
    }
    return selectedVerifier;
  }

  /**
   * @notice Allows the verifier to submit their secret.
   * @param _applicationId The application that the verifier is submitting for
   * @param _secret The secret that the verifier is guessing
   */
  function verifierSubmitSecret(bytes32 _applicationId, bytes32 _secret)
    public
    payable
    onlyVerifier(_applicationId)
    notWhistleblown(_applicationId)
  {
    Verification storage verification = verifications[_applicationId];
    Game storage game = games[_applicationId];

    require(msg.value >= game.applicationFeeWei, 'verifier is submitting enough ether');
    require(gamesIterator.hasValue(_applicationId), 'application has been initialized');
    require(verification.verifierSecret == bytes32(0), 'verify has not already been called');
    require(_secret.length > 0, 'secret is not empty');

    verification.verifierSecret = _secret;
    verification.verifierSubmittedAt = block.timestamp;
    verification.verifierDepositWei = msg.value;
    game.updatedAt = block.timestamp;

    emit VerifierSecretSubmitted(_applicationId, msg.sender, _secret);
  }

  /**
   * @notice Allows anyone to 'whistleblow' the applicant.  The whistleblower needs to submit the
   * applicationId and the applicant's random number.  If they match, the whistleblower takes the applicant's
   * deposit and fee.
   * @param _applicationId The application id
   * @param _randomNumber The random number the applicant used to mask their guess
   */
  function whistleblow(
    bytes32 _applicationId,
    uint256 _randomNumber
  )
    public
    applicationStarted(_applicationId)
    secretNotRevealed(_applicationId)
    notWhistleblown(_applicationId)
  {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    require(keccak256(abi.encodePacked(_randomNumber)) == game.randomHash, 'random number matches');

    // if a verifier was selected, refund
    if (verification.verifier != address(0)) {
      returnVerifierJobStake(_applicationId);
    }

    /// Transfer applicant's deposit to the whistleblower
    tilRegistry.token().transfer(
      msg.sender,
      game.applicantTokenDeposit
    );

    game.whistleblower = msg.sender;

    emit Whistleblown(msg.sender, _applicationId, _randomNumber);

    /// Transfer applicant's deposit to the whistleblower
    msg.sender.transfer(game.applicationFeeWei);
  }

  /**
   * @notice Allows the applicant to reveal their secret
   * @param _applicationId The id of the application
   * @param _secret The applicant's secret
   * @param _randomNumber The random number the applicant chose to obscure the secret
   */
  function applicantRevealSecret(
    bytes32 _applicationId,
    bytes32 _secret,
    uint256 _randomNumber
  ) public onlyApplicant(_applicationId) notWhistleblown(_applicationId) secretNotRevealed(_applicationId) {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    require(verification.verifierSecret != bytes32(0), 'verifier has submitted their secret');

    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == game.secretAndRandomHash, 'secret and random hash matches');
    require(rHash == game.randomHash, 'random hash matches');

    game.updatedAt = block.timestamp;
    game.applicantSecret = _secret;

    if (_secret != verification.verifierSecret) {
      applicantLost(_applicationId);
    } else {
      applicantWon(_applicationId);
    }
  }

  /**
   * @notice Allows the verifier to challenge when the applicant reveal timeframe has passed.  The verifier
   * will collect the application fee and the applicant's deposit will be returned.
   * @param _applicationId The application that the verifier is challenging
   */
  function verifierChallenge(
    bytes32 _applicationId
  ) public onlyVerifier(_applicationId) notWhistleblown(_applicationId) secretNotRevealed(_applicationId) {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    require(
      applicantRevealExpired(_applicationId),
      'applicant reveal period has expired'
    );
    require(
      verification.verifierChallengedAt == 0,
      'verifier has not already challenged'
    );
    verification.verifierChallengedAt = block.timestamp;

    /// Transfer the verifier's deposit back to them
    returnVerifierJobStake(_applicationId);
    game.updatedAt = block.timestamp;

    /// Transfer applicant's deposit back to them
    tilRegistry.token().transfer(
      game.applicant,
      game.applicantTokenDeposit
    );

    emit VerifierChallenged(_applicationId, msg.sender);

    /// Transfer the applicant's application fee to the verifier
    msg.sender.transfer(game.applicationFeeWei);
  }

  function applicantWon(bytes32 _applicationId) internal {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    /// provide the stake for the Registry
    tilRegistry.token().approve(address(tilRegistry), game.applicantTokenDeposit);

    tilRegistry.applicantWonCoordinationGame(
      _applicationId, game.applicant, game.applicantTokenDeposit
    );

    /// Return the verifier's job stake
    returnVerifierJobStake(_applicationId);
    /// Pay the verifier the application fee
    verification.verifier.transfer(game.applicationFeeWei);

    emit ApplicantWon(_applicationId);
  }

  function applicantLost(bytes32 _applicationId) internal {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    /// Approve of the verifier token transfer & applicant token transfer
    tilRegistry.token().approve(
      address(tilRegistry),
      game.applicantTokenDeposit.add(work.jobStake())
    );

    uint256 totalTransfer = game.applicationFeeWei.add(verification.verifierDepositWei);

    tilRegistry.applicantLostCoordinationGame.value(totalTransfer)(
      _applicationId, game.applicant, game.applicantTokenDeposit, totalTransfer,
      verification.verifier, work.jobStake()
    );

    emit ApplicantLost(_applicationId);
  }

  function returnVerifierJobStake(bytes32 _applicationId) internal {
    Verification storage verification = verifications[_applicationId];
    tilRegistry.token().approve(address(work), work.jobStake());
    work.depositJobStake(verification.verifier);
    uint256 deposit = verification.verifierDepositWei;
    verification.verifierDepositWei = 0;
    verification.verifier.transfer(deposit);
  }

  /**
   * @notice Returns the number of applications the applicant has made
   * @param _applicant The applicant
   */
  function getApplicantsApplicationCount(address _applicant) external view returns (uint256) {
    return applicantsApplicationIndices[_applicant].length();
  }

  /**
   * @notice Returns a particular applicant's application id at a certain index
   */
  function getApplicantsApplicationAtIndex(address _applicant, uint256 _index) external view returns (bytes32) {
    return applicantsApplicationIndices[_applicant].valueAtIndex(_index);
  }

  /**
   * @notice Returns the id of the last application the sender submitted
   * @param _applicant The applicant
   */
  function getApplicantsLastApplicationID(address _applicant) external view returns (bytes32) {
    if (applicantsApplicationIndices[_applicant].length() > 0) {
      uint256 index = applicantsApplicationIndices[_applicant].length().sub(1);
      return applicantsApplicationIndices[_applicant].valueAtIndex(index);
    } else {
      return 0;
    }
  }

  /**
   * @notice Returns the number of applications a user is verifying
   * @param _verifier The verifier
   */
  function getVerifiersApplicationCount(address _verifier) external view returns (uint256) {
    return verifiersApplicationIndices[_verifier].length();
  }

  /**
   * @notice Map an applicant's index of an application to the application id.  I.e. the application id for
   * their fourth application can be looked up by passing the applicant and '3'.
   * @param _applicant The applicant in question
   * @param _index The index of the application
   */
  function getVerifiersApplicationAtIndex(address _applicant, uint256 _index) external view returns (bytes32) {
    return verifiersApplicationIndices[_applicant].valueAtIndex(_index);
  }

  /**
   * @notice Returns the id of the last application the verifier was assigned to.
   * @param _verifier The verifier in question
   */
  function getVerifiersLastApplicationID(address _verifier) external view returns (bytes32) {
    if (verifiersApplicationIndices[_verifier].length() > 0) {
      uint256 index = verifiersApplicationIndices[_verifier].length().sub(1);
      return verifiersApplicationIndices[_verifier].valueAtIndex(index);
    } else {
      return 0;
    }
  }

  /**
   * @notice Returns whether the verifier is still able to submit their guess.
   * @param _applicationId The application to check
   */
  function verifierSubmissionTimedOut(bytes32 _applicationId) public view returns (bool) {
    return (block.timestamp - verifications[_applicationId].verifierSelectedAt) > verifierTimeoutInSeconds;
  }

  /**
   * @notice Returns whether the the applicant is still able to reveal their secret.
   * @param _applicationId The application to check
   */
  function applicantRevealExpired(bytes32 _applicationId) public view returns (bool) {
    return (block.timestamp - verifications[_applicationId].verifierSubmittedAt) > applicantRevealTimeoutInSeconds;
  }

  function verifierSubmittedSecret(bytes32 _applicationId) internal view returns (bool) {
    return verifications[_applicationId].verifierSecret != 0;
  }

  /**
   * @notice Allows the owner to update the settings for this contract.  The owner can change the fees or
   * the timeouts.
   * @param _applicationStakeAmount The amount of tokens the applicant must deposit for an application.
   * @param _baseApplicationFeeUsdWei The application fee, expressed in USD wei, that an applicant must pay
   * @param _verifierTimeoutInSeconds The duration in seconds which the verifier has to submit their guess
   * @param _applicantRevealTimeoutInSeconds The duration in seconds which the applicant can reveal the secret
   */
  function updateSettings(
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei,
    uint256 _verifierTimeoutInSeconds,
    uint256 _applicantRevealTimeoutInSeconds
  ) public onlyOwner {
    setApplicationStakeAmount(_applicationStakeAmount);
    setBaseApplicationFeeUsdWei(_baseApplicationFeeUsdWei);

    setVerifierTimeoutInSeconds(_verifierTimeoutInSeconds);
    setApplicantRevealTimeoutInSeconds(_applicantRevealTimeoutInSeconds);

    emit SettingsUpdated(
      applicationStakeAmount,
      baseApplicationFeeUsdWei,
      verifierTimeoutInSeconds,
      applicantRevealTimeoutInSeconds
    );
  }

  function setApplicantRevealTimeoutInSeconds(uint256 _applicantRevealTimeoutInSeconds) public onlyOwner {
    require(_applicantRevealTimeoutInSeconds > 0);

    applicantRevealTimeoutInSeconds = _applicantRevealTimeoutInSeconds;
  }

  function setVerifierTimeoutInSeconds(uint256 _verifierTimeoutInSeconds) public onlyOwner {
    require(_verifierTimeoutInSeconds > 0);

    verifierTimeoutInSeconds = _verifierTimeoutInSeconds;
  }

  function setBaseApplicationFeeUsdWei(uint256 _baseApplicationFeeUsdWei) public onlyOwner {
    require(_baseApplicationFeeUsdWei > 0);

    baseApplicationFeeUsdWei = _baseApplicationFeeUsdWei;
  }

  /**
   * @notice Returns the application fee in Ether, as calculated using the baseApplicationFeeUsdWei and the
   * etherPriceFeed.
   */
  function weiPerApplication() public view returns (uint256) {
    uint256 usdPerKwei = usdWeiPerEther().div(1000000000000000);
    uint256 kweiPerApplication = baseApplicationFeeUsdWei.div(usdPerKwei);

    return kweiPerApplication.mul(1000);
  }

  /**
   * @notice Returns the etherPriceFeed value cast to a uint256
   */
  function usdWeiPerEther() public view returns (uint256) {
    return uint256(etherPriceFeed.read());
  }

  /**
   * @notice Returns the number of applications
   */
  function applicationCount() public view returns (uint256) {
    return gamesIterator.length();
  }

  /**
   * @notice Returns the application id at the given index
   * @param _index The index to retrieve
   */
  function applicationAt(uint256 _index) public view returns (bytes32) {
    return gamesIterator.valueAtIndex(_index);
  }

  /**
   * @notice Returns whether an application id actually exists
   * @param _applicationId The id to search for
   */
  function applicationExists(bytes32 _applicationId) public view returns (bool) {
    return games[_applicationId].applicant != address(0);
  }
}
