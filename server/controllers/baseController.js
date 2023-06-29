const constants = require('../utils/constants')
const { responseSuccess } = require('../utils/helpers')
const expressAsyncHandler = require('express-async-handler')
const User = require('../models/User')
const ChatUser = require('../models/ChatUser')
const Chat = require('../models/Chat')
const ChatMessage = require('../models/ChatMessage')
const ErrorMessageException = require('../exceptions/ErrorMessageException')


// =====================================================================================================
const start = expressAsyncHandler(async (req, res) => {
    responseSuccess(res, 'success', {
        version : 1,
    })
})


// =====================================================================================================
const search = async (req, res) => {
    const searchIn = req.query.type
    const searchQuery = req.query.query
    const userId = req.user_id
    let result = null

    if (!searchQuery) throw new ErrorMessageException('Enter a query')

    if (searchIn == 'user') result = await searchUsers(searchQuery, userId)

    else if (searchIn == 'group') result = await searchGroups(searchQuery, userId)
          
    else if (searchIn == 'chatMessage') result = await searchMessages(searchQuery)

    return responseSuccess(res, 'success', {
        'result': result,
    })
}

const searchUsers = async (searchQuery, userId) => {
    const foundUsers = await User.find({
        [constants.COL_USER_USERNAME]: new RegExp(searchQuery, 'i')
    })
        .where(constants.COL_USER_ID).ne(userId)
        .select('-password').exec()


    let userChatsWithFoundUsers = []

    if (foundUsers.length > 0) {
        let foundUserIds = []

        foundUsers.forEach(user => {
            foundUserIds.push(user[constants.COL_USER_ID])
        })

        userChatsWithFoundUsers = await ChatUser
            .find({
                [constants.COL_CHAT_USER_USER_ID] : userId, 
            })
            .where(constants.COL_CHAT_USER_TARGET_USER_ID).in(foundUserIds)
            .lean().exec()
    }

    foundUsers.forEach(foundUser => {
        userChatsWithFoundUsers.forEach(chatUser => {
            if( foundUser[constants.COL_USER_ID] == chatUser[constants.COL_CHAT_USER_TARGET_USER_ID] ) foundUser.chat_id = chatUser[constants.COL_CHAT_USER_CHAT_ID]
        })
    })
    

    return foundUsers
}

const searchGroups = async (searchQuery, userId) => {
    const foundChats = await Chat.find().or([
        {
            [constants.COL_CHAT_NAME]: new RegExp(searchQuery, 'i')
        }
    ]).select(`-${constants.COL_CHAT_PRIVACY_SETTING}.${constants.COL_CHAT_PRIVACY_SETTING_PASSWORD}`).exec()


    let userChats = []

    if (foundChats.length > 0) {
        let foundChatIds = []

        foundChats.forEach(chat => {
            foundChatIds.push(chat[constants.COL_CHAT_ID].valueOf())
        })
        
        userChats = await ChatUser
            .find({
                [constants.COL_CHAT_USER_USER_ID]: userId,
            })
            .where(constants.COL_CHAT_USER_CHAT_ID).in(foundChatIds)
            .lean().exec()
    }


    const result = {
        user_chats: [],
        chats: [],
    }


    foundChats.map(chat => {
        let userIsMemberOfChat = false

        userChats.forEach(userChat => {
            if (chat[constants.COL_CHAT_ID].valueOf() == userChat[constants.COL_CHAT_USER_CHAT_ID].valueOf()) userIsMemberOfChat = true
        })

        const chatObject = { ...chat.toObject({ getters: true })}
        
        if (userIsMemberOfChat) {
            chatObject.is_member = 1
            result.user_chats.push(chatObject)
        }
        else {
            chatObject.is_member = 0
            result.chats.push(chatObject)
        }
    })

    return result
}

const searchMessages = async (searchQuery) => {
    const result = await ChatMessage.find({
        [constants.COL_CHAT_MESSAGE_TYPE]: constants.ENUM_CHAT_MESSAGE_TYPE_TEXT,
        [constants.COL_CHAT_MESSAGE_MESSAGE]: new RegExp(searchQuery, 'i'),
    }).lean().exec()

    return result
}


// =====================================================================================================
module.exports = {
    start,
    search,
}