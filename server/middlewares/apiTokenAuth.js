const AuthenticationErrorException = require('../exceptions/AuthenticationErrorException')
const jwt = require('jsonwebtoken')
const { authCheck } = require('../utils/helpers')



const apiTokenAuth = async (req, res, next) => {
    try{
        const decoded = await authCheck(req)
        req.user_id = decoded.id
        next()
    }
    catch{
        return next(new AuthenticationErrorException())
    }
}


module.exports = apiTokenAuth