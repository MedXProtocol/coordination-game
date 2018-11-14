const EtherPriceFeed = artifacts.require('EtherPriceFeed.sol');

contract('EtherPriceFeed', function (accounts) {
  const [owner, admin] = accounts

  describe('set()', () => {
    it("should work", async () => {
      const etherPriceFeed = await EtherPriceFeed.new()
      etherPriceFeed.init(owner, web3.toWei('200', 'ether'))

      etherPriceFeed.set(web3.toWei('100.52', 'ether'))
      assert.equal(web3.toDecimal(await etherPriceFeed.read()), web3.toWei('100.52', 'ether'))
    })
  })
})
