const { TestHelper } = require('zos')

let project

module.exports = async function (accounts) {
  if (!project) {
    project = await TestHelper({ from: accounts[1] })
  }
  return project
}
