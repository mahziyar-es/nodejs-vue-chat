const constants = require('../utils/constants')
const { responseSuccess, currentDate, currentTime, uploadFile, copyFile, deleteFile } = require('../utils/helpers')
const expressAsyncHandler = require('express-async-handler')
const User = require('../models/User')
const ChatUser = require('../models/ChatUser')
const Chat = require('../models/Chat')
const ChatMessage = require('../models/ChatMessage')
const ErrorMessageException = require('../exceptions/errorMessageException')
const DeletedMessage = require('../models/DeletedMessage')
const Block = require('../models/Block')
const { findBlock } = require('./userController')



// =====================================================================================================
const chatMessages = expressAsyncHandler(async (req, res) => {
    const chatId = req.query.chat_id
    const count = req.query.count

    if (!chatId) throw new ErrorMessageException('Chat not found')

    const chat = await Chat.findById(chatId).lean().exec()
    
    if (!chat) throw new ErrorMessageException('Chat not found')

    const chatType = chat[constants.COL_CHAT_TYPE]
    const chatPrivacySettings = chat[constants.COL_CHAT_PRIVACY_SETTING]
    const chatPrivacyType = chatPrivacySettings[constants.COL_CHAT_PRIVACY_SETTING_PRIVACY_TYPE]

    const chatUser = await ChatUser.findOne({
        [constants.COL_CHAT_USER_CHAT_ID]: chatId,
        [constants.COL_CHAT_USER_USER_ID]: req.user_id,
    }).lean().exec()


    const chatMessageFilters = {}
    
    if (chatType == constants.ENUM_CHAT_TYPE_PRIVATE && !chatUser) {
        throw new ErrorMessageException('Not allowed')
    }
    else if(chatType == constants.ENUM_CHAT_TYPE_GROUP && chatPrivacyType == constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PRIVATE && !chatUser){
        throw new ErrorMessageException('Not allowed')
    }

    const userDeletedMessageIds = await getUserDeletedMessageIds(req.user_id)

    let chatMessages = await ChatMessage.find({
        [constants.COL_CHAT_MESSAGE_CHAT_ID]: chatId,
        [constants.COL_CHAT_MESSAGE_ID]: {$nin: userDeletedMessageIds},
    })
        .sort({
            [constants.COL_CHAT_MESSAGE_CREATED_AT]: -1,
            ...chatMessageFilters
        })
        .skip(count).limit(20)
        .populate(constants.COL_CHAT_MESSAGE_FORWARDED_FROM_USER, [constants.COL_USER_ID, constants.COL_USER_USERNAME, constants.COL_USER_IMAGE])
        .exec()


    const chatMessageSenderIds = chatMessages.map(chatMessage => chatMessage[constants.COL_CHAT_MESSAGE_SENDER_ID])

    const senderUsers = await User.find().where(constants.COL_USER_ID).in(chatMessageSenderIds)
    .select(`${constants.COL_USER_ID} ${constants.COL_USER_USERNAME} ${constants.COL_USER_IMAGE}`)
    .exec()

    chatMessages = chatMessages.reverse()

    return responseSuccess(res, 'success', {
        messages: chatMessages,
        users: senderUsers,
    })
})


const getUserDeletedMessageIds = async (user_id) => {
    const userDeletedMessages = await DeletedMessage.find({
        [constants.COL_DELETED_MESSAGE_USER_ID]: user_id,
    }).lean().exec()

    let userDeletedMessageIds = []
    userDeletedMessages.map(delMessage => {
        userDeletedMessageIds.push(delMessage[constants.COL_DELETED_MESSAGE_MESSAGE_ID].valueOf())
    })

    return userDeletedMessageIds
}


// =====================================================================================================
const deleteMessages = async (chatId, messageIds, userId) => {
    
    const messages = await ChatMessage.find({
        [constants.COL_CHAT_MESSAGE_ID] : {$in : messageIds},
        [constants.COL_CHAT_MESSAGE_CHAT_ID] : chatId,
    }).select(`
        ${constants.COL_CHAT_MESSAGE_ID}

        ${constants.COL_CHAT_MESSAGE_SENDER_ID}

        ${constants.COL_CHAT_MESSAGE_TYPE}

        ${constants.COL_CHAT_MESSAGE_MESSAGE}
    `)
    
    let userOwnedMessageIds = []
    let files = []
    let otherMessageIds = []

    messages.map(m => {
        if (m[constants.COL_CHAT_MESSAGE_SENDER_ID] == userId) {
            userOwnedMessageIds.push(m.id)
            if (m.type == constants.ENUM_CHAT_MESSAGE_TYPE_FILE) {
                files.push(m.message)
            }
        } else {
            otherMessageIds.push(m.id)
        }
    })


    if (userOwnedMessageIds.length > 0) {
        await ChatMessage.deleteMany({
            [constants.COL_CHAT_MESSAGE_ID] : {$in : userOwnedMessageIds},
        }).exec()
        
        if (files.length > 0) {
            await deleteFile(constants.DIR_UPLOADS, files)
        }
    }

    if (otherMessageIds.length > 0) {
        const deletedMessagesArray = []
        otherMessageIds.forEach(messageId => {
            deletedMessagesArray.push({
                [constants.COL_DELETED_MESSAGE_USER_ID] : userId,
                [constants.COL_DELETED_MESSAGE_MESSAGE_ID] : messageId,
            })
        })
        await DeletedMessage.insertMany(deletedMessagesArray)
    }

    return [userOwnedMessageIds, otherMessageIds]
}


// =====================================================================================================
const clearUserHistory = async (chatId, userId) => {
    const messages = await ChatMessage.find({
        [constants.COL_CHAT_MESSAGE_CHAT_ID] : chatId,
        [constants.COL_CHAT_MESSAGE_SENDER_ID] : userId,
    }).select(`${constants.COL_CHAT_MESSAGE_ID} ${constants.COL_CHAT_MESSAGE_TYPE} ${constants.COL_CHAT_MESSAGE_MESSAGE}`)

    let messageIds = []
    let files = []

    messages.map(m => {
        messageIds.push(m.id)
        if (m.type == 'file') files.push(m.message)
    })

    if (messageIds.length > 0) {
        await ChatMessage.deleteMany({
            [constants.COL_CHAT_MESSAGE_ID] : {$in : messageIds},
        }).exec()
        if (files.length > 0) await deleteFile(constants.DIR_UPLOADS, files)
    }

    return messageIds
}


// =====================================================================================================
const saveMessage = async (chatId, senderId, newMessage, messageType = constants.ENUM_CHAT_MESSAGE_TYPE_TEXT) => {

    let msg = newMessage

    if (messageType == constants.ENUM_CHAT_MESSAGE_TYPE_FILE) msg = await uploadFile(newMessage, 'uploads')
    
    const message = new ChatMessage({
        [constants.COL_CHAT_MESSAGE_CHAT_ID]: chatId,
        [constants.COL_CHAT_MESSAGE_SENDER_ID]: senderId,
        [constants.COL_CHAT_MESSAGE_TYPE]: messageType,
        [constants.COL_CHAT_MESSAGE_MESSAGE]: msg,
        [constants.COL_CHAT_MESSAGE_DATE]: currentDate(),
        [constants.COL_CHAT_MESSAGE_TIME]: currentTime(),
    })
    await message.save()

    return message
} 


// =====================================================================================================
const forwardMessage = async (senderUserId, chatId, messageId) => {
    
    const message = await ChatMessage.findById(messageId).lean().exec()

    if (!message) throw new ErrorMessageException('Message not found')

    const chat = await Chat.findById(chatId).lean().exec()

    if(!chat) throw new ErrorMessageException('Chat not found')

    const chatUser = await ChatUser.findOne({
        [constants.COL_CHAT_USER_USER_ID]: senderUserId,
        [constants.COL_CHAT_USER_CHAT_ID]: chatId,
    }).lean().exec()

    if (!chatUser) throw new ErrorMessageException('You are not a member of this chat')

    else if(chat[constants.COL_CHAT_TYPE] == constants.ENUM_CHAT_TYPE_PRIVATE){
        const block = await findBlock(senderUserId, chatUser[constants.COL_CHAT_USER_TARGET_USER_ID])
        if (block) throw new ErrorMessageException('Not allowed')
    }

    let messageContent = message[constants.COL_CHAT_MESSAGE_MESSAGE]

    if (message[constants.COL_CHAT_MESSAGE_TYPE] == constants.ENUM_CHAT_MESSAGE_TYPE_FILE) {
        messageContent = await copyFile(message[constants.COL_CHAT_MESSAGE_MESSAGE], constants.DIR_UPLOADS, constants.DIR_UPLOADS)
    }

    const forwardedMessage = new ChatMessage({
        [constants.COL_CHAT_MESSAGE_CHAT_ID]: chatId,
        [constants.COL_CHAT_MESSAGE_SENDER_ID]: senderUserId,
        [constants.COL_CHAT_MESSAGE_FORWARDED_FROM_USER]: message[constants.COL_CHAT_MESSAGE_SENDER_ID],
        [constants.COL_CHAT_MESSAGE_FORWARDED_FROM_MESSAGE]: message[constants.COL_CHAT_MESSAGE_ID],
        [constants.COL_CHAT_MESSAGE_TYPE]: message[constants.COL_CHAT_MESSAGE_TYPE],
        [constants.COL_CHAT_MESSAGE_MESSAGE]: messageContent,
        [constants.COL_CHAT_MESSAGE_DATE]: currentDate(),
        [constants.COL_CHAT_MESSAGE_TIME]: currentTime(),
    })
    await forwardedMessage.save()

    forwardedMessage.populate(constants.COL_CHAT_MESSAGE_FORWARDED_FROM_USER, [constants.COL_USER_ID, constants.COL_USER_USERNAME, constants.COL_USER_IMAGE])
    
    const user = await User.findById(senderUserId).select(`${constants.COL_USER_ID} ${constants.COL_USER_USERNAME} ${constants.COL_USER_IMAGE}`).exec()

    return [forwardedMessage, user]
}



module.exports = {
    chatMessages,
    getUserDeletedMessageIds,
    deleteMessages,
    clearUserHistory,
    saveMessage,
    forwardMessage,
}