module.exports = async (inner) => {
  new Promise((resolve, reject) =>
    inner( (err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  )
};
