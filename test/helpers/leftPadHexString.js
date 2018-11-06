module.exports = function (hexString, bytes) {
  let result = hexString

  // chop off the 0x
  result = result.substr(2, hexString.length)

  while (result.length < bytes * 2) {
    result = '0' + result
  }

  return '0x' + result
}
