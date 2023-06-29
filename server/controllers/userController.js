const constants = require('../utils/constants')
const { responseSuccess, uploadFile, deleteFile } = require('../utils/helpers')
const bcrypt = require('bcrypt')
const expressAsyncHandler = require('express-async-handler')
const User = require('../models/User')
const ChatUser = require('../models/ChatUser')
const ErrorMessageException = require('../exceptions/ErrorMessageException')
const Block = require('../models/Block')




// =====================================================================================================
const user = expressAsyncHandler( async (req, res) => {
    const id = req.params.id || req.user_id

    if(!id) throw new ErrorMessageException('Invalid request')

    const user = await User.findById(id).select(`-${constants.COL_USER_PASSWORD}`).exec()

    const blocked = await Block.exists({
        [constants.COL_BLOCK_USER_ID]: req.user_id,
        [constants.COL_BLOCK_BLOCKED_USER_ID]: id,
    })

    return responseSuccess(res, 'success', {
        user: user,
        current_user_id: req.user_id,
        blocked: blocked ? 1 : 0,
    })
})


// =====================================================================================================
const userProfileUpdate = expressAsyncHandler(async (req, res) => {

    const username = req.body.username
    const image = req.files?.image

    let user = await User.findById(req.user_id).exec()

    if(!user) throw new ErrorMessageException('User not found')

    if (image) {
        const newImage = await uploadFile(image, constants.DIR_USER_IMAGES)
        await deleteFile(constants.DIR_USER_IMAGES, user[constants.COL_USER_IMAGE])
        user[constants.COL_USER_IMAGE] = newImage
    }

    if (username) {
        const usernameExists = await User.findOne({
            [constants.COL_USER_USERNAME]: username,
        })
        .where(constants.COL_USER_ID).ne(req.user_id)
        .lean().exec()

        if (usernameExists) throw new ErrorMessageException('Username already exists.')
        
        user[constants.COL_USER_USERNAME] = username
    }

    await user.save()

    const userForResponse = {
        _id: user[constants.COL_USER_ID],
        username: user[constants.COL_USER_USERNAME],
        image: user[constants.COL_USER_IMAGE],
    }

    return responseSuccess(res, 'success', {
        'user': userForResponse
    })
})


// =====================================================================================================
const changePassword = expressAsyncHandler(async (req, res) => {
    const oldPass = req.body.old_password
    const newPass = req.body.new_password

    if(!oldPass) throw new ErrorMessageException('Current password is required')
    if(!newPass) throw new ErrorMessageException('New password is required')

    const user = await User.findById(req.user_id).lean().exec()

    const passwordMatched = await bcrypt.compare(oldPass, user[constants.COL_USER_PASSWORD])

    if (!passwordMatched) throw new ErrorMessageException('Current password is incorrect')

    // TODO : check password regex

    const newHashedPass = await bcrypt.hash(newPass, 10)

    await User.findOneAndUpdate(
        {
            [constants.COL_USER_ID]: req.user_id,
        },
        {
            [constants.COL_USER_PASSWORD]: newHashedPass
        }
    )

    return responseSuccess(res, 'Password changed') 
})


// =====================================================================================================
const blockUser = expressAsyncHandler(async (req, res) => {
    const targetUserId = req.body.target_user_id

    if(targetUserId == req.user_id) throw new ErrorMessageException('Not allowed')

    const exists = await Block.findOne({
        [constants.COL_BLOCK_USER_ID]: req.user_id,
        [constants.COL_BLOCK_BLOCKED_USER_ID]: targetUserId,
    }).lean().exec()

    if (exists) throw new ErrorMessageException('You blocked this user before')

    const chatUser = await ChatUser.findOne({
        [constants.COL_CHAT_USER_USER_ID]: {$in: [req.user_id, targetUserId]},
        [constants.COL_CHAT_USER_TARGET_USER_ID]: {$in: [req.user_id, targetUserId]},
    }).lean().exec()

    const chatId = chatUser[constants.COL_CHAT_USER_CHAT_ID].valueOf()

    await new Block({
        [constants.COL_BLOCK_USER_ID]: req.user_id,
        [constants.COL_BLOCK_BLOCKED_USER_ID]: targetUserId,
    }).save()

    req.app.get('socket').to(`user-${targetUserId}`).emit("blocked", {
        user_id: req.user_id,
    })

    return responseSuccess(res, 'success')
})


// =====================================================================================================
const unblockUser = expressAsyncHandler(async (req, res) => {
    const targetUserId = req.body.target_user_id

    const exists = await Block.findOne({
        [constants.COL_BLOCK_USER_ID]: req.user_id,
        [constants.COL_BLOCK_BLOCKED_USER_ID]: targetUserId,
    }).lean().exec()

    if (!exists) throw new ErrorMessageException('User is not blocked')

    await Block.deleteOne({
        [constants.COL_BLOCK_USER_ID]: req.user_id,
        [constants.COL_BLOCK_BLOCKED_USER_ID]: targetUserId,
    })
        
    req.app.get('socket').to(`user-${targetUserId}`).emit("unblocked", {
        user_id: req.user_id,
    })

    return responseSuccess(res, 'success')
})


// =====================================================================================================
const findBlock = async (userId, targetUserId) => {
    const ids = [userId, targetUserId]
    const block = await Block.findOne({
      [constants.COL_BLOCK_USER_ID] : {$in : ids},  
      [constants.COL_BLOCK_BLOCKED_USER_ID] : {$in: ids},  
    }).lean().exec()
  
    if (block) return block
    return false
}


// =====================================================================================================
const toggleUserOnlineStatus = async (userId, isOnline = false) => {
    await User.findOneAndUpdate(
        {
            [constants.COL_USER_ID]: userId,
        },
        {
            [constants.COL_USER_IS_ONLINE]: isOnline,
        }
    )
}



module.exports = {
    user,
    userProfileUpdate,
    changePassword,
    blockUser,
    unblockUser,
    findBlock,
    toggleUserOnlineStatus,
}