const AuthenticationErrorException = require('../exceptions/AuthenticationErrorException')
const jwt = require('jsonwebtoken')



const apiTokenAuth = (req, res, next) => {

    if (!req.cookies || !req.cookies.access_token) return next(new AuthenticationErrorException())
    
    const accessToken = req.cookies.access_token

    if (!accessToken) return next(new AuthenticationErrorException())

    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new AuthenticationErrorException())
        if (!decoded.id) return next(new AuthenticationErrorException())

        req.user_id = decoded.id

        next()

    })
}


module.exports = apiTokenAuth