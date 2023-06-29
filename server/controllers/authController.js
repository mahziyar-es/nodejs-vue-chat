const constants = require('../utils/constants')
const { generateJWT } = require('../utils/helpers')
const bcrypt = require('bcrypt')
const expressAsyncHandler = require('express-async-handler')
const User = require('../models/User')
const ErrorMessageException = require('../exceptions/ErrorMessageException')


// =====================================================================================================
const login = expressAsyncHandler( async (req, res) => {

    const username = req.body.username
    const password = req.body.password

    if (!username || !password) throw new ErrorMessageException('All field are required')

    const user = await User.findOne({
        [constants.COL_USER_USERNAME]: username
    }).exec()

    if(!user) throw new ErrorMessageException('Wrong credentials')

    const passwordMatched = await bcrypt.compare(password, user[constants.COL_USER_PASSWORD])

    if(!passwordMatched) throw new ErrorMessageException('Wrong credentials')

    const apiToken = generateJWT(user._id)

    return res.cookie('access_token', apiToken, {
        httpOnly: true,
        secure: false,
    })
    .json({
        message: 'logged in',
        user_id: user[constants.COL_USER_ID].valueOf(),
        user_username: user[constants.COL_USER_USERNAME],
        user_image: user[constants.COL_USER_IMAGE],
    })
} )


// =====================================================================================================
const signup = expressAsyncHandler( async (req, res) => {

    const username = req.body.username
    const password = req.body.password

    if (!username || !password) throw new ErrorMessageException('All field are required')
    
    // TODO : check password regex

    const usernameExists = await User.findOne({ 
       [constants.COL_USER_USERNAME]: username 
    }).lean().exec()

    if (usernameExists) throw new ErrorMessageException('Username exists. choose another username')
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        [constants.COL_USER_USERNAME] : username,
        [constants.COL_USER_PASSWORD] : hashedPassword,
    })
    
    const apiToken = generateJWT(user._id)

    return res.cookie("access_token", apiToken, {
      httpOnly: true,
      secure: false,
    })
    .json({
        message: 'success',
        user_id: user[constants.COL_USER_ID].valueOf(),
        user_username: user[constants.COL_USER_USERNAME],
        user_image: user[constants.COL_USER_IMAGE],
    })

})


// =====================================================================================================
const logout = expressAsyncHandler( async (req, res) => {
    return res.clearCookie('access_token').json({
        message: 'logged out'
    })
})



module.exports = {
    login,
    signup,
    logout,
}