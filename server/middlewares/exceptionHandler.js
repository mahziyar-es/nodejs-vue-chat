
const { errorLogger } = require('../utils/helpers')

const exceptionHandler = (error, req, res, next) => {
    errorLogger(error.stack.toString())
    res.status(error.code || 500).send({
        message: error.message,
    })
}

module.exports = exceptionHandler