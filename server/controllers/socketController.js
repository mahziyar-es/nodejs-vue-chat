const Block = require("../models/Block")
const Chat = require("../models/Chat")
const ChatMessage = require("../models/ChatMessage")
const ChatUser = require("../models/ChatUser")
const DeletedMessage = require("../models/DeletedMessage")
const User = require("../models/User")
const ioConnection = require("../socketConnection")
const constants = require("../utils/constants")
const { deleteFile, currentTimestamp } = require("../utils/helpers")
const { createConversation, createOneToOneChat, findOneToOneChat, createoneToOneChatUsers, joinGroup } = require("./chatController")
const { saveMessage, getUserDeletedMessageIds, clearUserHistory } = require("./messageController")
const bcrypt = require('bcrypt')
const { deleteMessages } = require("./messageController")
const { findBlock, toggleUserOnlineStatus } = require("./userController")


// ======================================================================================================================
const listenToChats = async (ioConnection, socket, groupIds, targetUserIds, callback = null) => {

    if (groupIds) {

        groupIds = groupIds.split(',')
        if (groupIds.length == 0) return

        const chats = await Chat.find({
            [constants.COL_CHAT_TYPE]: { $ne: constants.ENUM_CHAT_TYPE_PRIVATE }
        }).where(constants.COL_CHAT_ID).in(groupIds).lean().exec()
            

        const currentUserChatsMembership = await ChatUser.find({
            [constants.COL_CHAT_USER_USER_ID]: socket.user_id, 
        }).where(constants.COL_CHAT_USER_CHAT_ID).in(groupIds).lean().exec()


        chats.forEach((chat, index) => {
            
            let foundChatUser
            currentUserChatsMembership.map(userChat => {
                if(userChat[constants.COL_CHAT_USER_CHAT_ID].valueOf() == chat[constants.COL_CHAT_ID].valueOf()) foundChatUser = userChat
            })
            if (!foundChatUser) return

            socket.join(`chat-${chat[constants.COL_CHAT_ID]}`)
        })
    }

    if (targetUserIds) {

        targetUserIds = targetUserIds.split(',')
        if (targetUserIds.length == 0) return

        const chatUsers = await ChatUser.find({
            [constants.COL_CHAT_USER_USER_ID]: socket.user_id,
            [constants.COL_CHAT_USER_TARGET_USER_ID]: {$in: targetUserIds},
        }).lean().exec()

        targetUserIds = []
        chatUsers.map(chatUser => {
            targetUserIds.push(chatUser[constants.COL_CHAT_USER_TARGET_USER_ID])
        })

        const blocks = await Block.find({
            [constants.COL_BLOCK_BLOCKED_USER_ID]: socket.user_id,
            [constants.COL_BLOCK_USER_ID]: {$in: targetUserIds},
        })

        let blockedByUserIds = []
        blocks.map(block => {
            blockedByUserIds.push(block[constants.COL_BLOCK_USER_ID])
        })

        let finalTargetUserIds = []
        targetUserIds.map(targetUserId => {
            if(blockedByUserIds.indexOf(targetUserId) == -1) finalTargetUserIds.push(targetUserId)
        })

        finalTargetUserIds.map(targetUserId => {
            listenToPrivateChatTargetInfoChanges(socket, targetUserId)
        })
    }
        
}


// ======================================================================================================================
const listenToPrivateChatTargetInfoChanges = (socket, targetUserId) => {
    socket.join(`private-chat-target-${targetUserId}`)
} 


// ======================================================================================================================
const stopListeningToPrivateChatTargetInfoChanges = (socket, targetUserId) => {
    socket.leave(`private-chat-target-${targetUserId}`)
} 


// ======================================================================================================================
const connectToGroupChat = async (ioConnection, socket, chatId, callback) => {
    if(!chatId) return

    const chat = await Chat.findById(chatId).lean().exec()

    if (!chat) {
        callback?.('Chat not found')
        return 
    }

    const chatUser = await ChatUser.findOne({
        [constants.COL_CHAT_USER_USER_ID]: socket.user_id, 
        [constants.COL_CHAT_USER_CHAT_ID]: chat[constants.COL_CHAT_ID].valueOf(), 
    }).lean().exec()

    let is_member = false
    if (chatUser) is_member = true


    const chatPrivacyType = chat[constants.COL_CHAT_PRIVACY_SETTING][constants.COL_CHAT_PRIVACY_SETTING_PRIVACY_TYPE]
    let canJoin = false
    if(chatPrivacyType == constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PUBLIC) canJoin = true
    else if (chatPrivacyType == constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PRIVATE && is_member) canJoin = true

    group_chat_connection_info = {
        chat_id : chatId,
        chat_type : constants.ENUM_CHAT_TYPE_GROUP,
        is_member : is_member,
    }
    socket.group_chat_connection_info = group_chat_connection_info

    // TODO : refactor
    if (canJoin) socket.join(`chat-${chatId}`)
    
    callback?.()
}


// ======================================================================================================================
const connectToPrivateChat = async (ioConnection, socket, targetUserId, callback) => {
    if(!targetUserId) return

    const targetUser = await User.findById(targetUserId).lean().exec()

    if (!targetUser) {
        callback?.('User not found')
        return 
    }

    const block = await findBlock(socket.user_id, targetUserId)
    if (block) {
        callback?.('Blocked')
        return
    }

    const chatId = await findOneToOneChat(socket.user_id, targetUserId)
    
    socket.private_chat_connection_info = {
        chat_id: chatId,
        chat_type: constants.ENUM_CHAT_TYPE_PRIVATE,
        target_user_id: targetUserId,
        blocked: false,
    }

    listenToPrivateChatTargetInfoChanges(socket, targetUserId)

    callback?.()
}


// ======================================================================================================================
const socketSendMessage = async (ioConnection, socket, newMessage, callback) => {

    // messaging in chat (channel or group)
    if (socket.group_chat_connection_info) {

        if (!socket.group_chat_connection_info.is_member) return

        const chatId = socket.group_chat_connection_info.chat_id

        let message = await saveMessage(chatId, socket.user_id, newMessage)

        emitGroupChatNewMessage(ioConnection, chatId, message, socket.user)
       
        callback?.(newMessageInfo)
    }

    // one to one messaging
    else if (socket.private_chat_connection_info) {

        if (socket.private_chat_connection_info.blocked) return
        
        const block = await findBlock(socket.user_id, socket.private_chat_connection_info.target_user_id)
        if (block) {
            socket.private_chat_connection_info.blocked = true
            return
        }
        
        if (!socket.private_chat_connection_info.chat_id) {
            socket.private_chat_connection_info.chat_id = await findOneToOneChat(socket.user_id, socket.private_chat_connection_info.target_user_id)
            if (!socket.private_chat_connection_info.chat_id) {
                const chat = await createOneToOneChat(socket.user_id, socket.private_chat_connection_info.target_user_id)
                socket.private_chat_connection_info.chat_id = chat._id.valueOf()
                listenToPrivateChatTargetInfoChanges(socket, socket.private_chat_connection_info.target_user_id)
            }
        }

        await createoneToOneChatUsers(socket.private_chat_connection_info.chat_id, socket.user_id, socket.private_chat_connection_info.target_user_id)

        const targetUser = await User.findById(socket.private_chat_connection_info.target_user_id).exec()

        let message = await saveMessage(socket.private_chat_connection_info.chat_id, socket.user_id, newMessage)

        emitPrivateChatNewMessage(
            ioConnection,
            socket.private_chat_connection_info.target_user_id,
            socket.private_chat_connection_info.chat_id,
            message,
            socket.user,
            socket.user,
        )

        socket.emit('new-message', {
            chat: {
                _id: socket.private_chat_connection_info.chat_id,
                type: socket.private_chat_connection_info.chat_type,
            },
            message: message,
            sender_user: socket.user,
            target_user: targetUser,
        })
        callback?.(newMessageInfo)
    }

}

const emitGroupChatNewMessage = (ioConnection, chatId, message, senderUser) => {
    const newMessageInfo = {
        chat: {
            _id: chatId,
            type: constants.ENUM_CHAT_TYPE_GROUP,
        },
        message: message,
        sender_user: senderUser,
    }
    ioConnection.to(`chat-${chatId}`).emit("new-message",newMessageInfo)
}

const emitPrivateChatNewMessage = (ioConnection, userIdToEmitTo, chatId, message, senderUser, targetUser) => {
    ioConnection.to(`user-${userIdToEmitTo}`).emit("new-message",{
        chat: {
            _id: chatId,
            type: constants.ENUM_CHAT_TYPE_PRIVATE,
        },
        message: message,
        sender_user: senderUser,
        target_user: targetUser,
    })
}


// ======================================================================================================================
const socketForwardMessage = async (ioConnection, socket, chatId, messageId, callback) => {
    
}


// ======================================================================================================================
const userTyping = (ioConnection, socket) => {

    if (socket.group_chat_connection_info) {

        if (!socket.group_chat_connection_info.is_member) return
        
        const chatId = socket.group_chat_connection_info.chat_id

        if (socket.blocked_in_chat_ids.indexOf(chatId) != -1) return
        
        socket.to(`chat-${chatId}`).emit("user-typing", {
            chat: {
                _id: chatId,
                type: constants.ENUM_CHAT_TYPE_GROUP,
            }
        })
    }
    else if (socket.private_chat_connection_info) {

        if (socket.private_chat_connection_info.blocked) return
        
        const chatId = socket.private_chat_connection_info.chat_id
        
        ioConnection.to(`user-${socket.private_chat_connection_info.target_user_id}`).emit("user-typing", {
            chat: {
                _id: chatId,
                type: constants.ENUM_CHAT_TYPE_PRIVATE,
            },
            typing_user_id: socket.user_id
        })
    }
}


// ======================================================================================================================
const deleteMessage = async (ioConnection, socket, messageIds, callback = null) => {
    if(!Array.isArray(messageIds))  messageIds = [messageIds] 

    const chatId = socket.group_chat_connection_info?.chat_id || socket.private_chat_connection_info?.chat_id

    if(!chatId) return

    const [userOwnedMessageIds, otherMessageIds] = await deleteMessages(chatId, messageIds, socket.user_id)

    if (socket.group_chat_connection_info) {
        ioConnection.to(`chat-${chatId}`).emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.group_chat_connection_info.chat_type,
            },
            deleted_message_ids: userOwnedMessageIds,
        })
        socket.emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.group_chat_connection_info.chat_type,
            },
            deleted_message_ids: otherMessageIds,
        })
    }
    else if (socket.private_chat_connection_info) {
        ioConnection.to(`user-${socket.private_chat_connection_info.target_user_id}`).emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.private_chat_connection_info.chat_type,
            },
            target_user_id: socket.user_id,
            deleted_message_ids: userOwnedMessageIds,
        })
        socket.emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.private_chat_connection_info.chat_type,
            },
            target_user_id: socket.private_chat_connection_info.target_user_id,
            deleted_message_ids: userOwnedMessageIds.concat(otherMessageIds),
        })
    }
        
    callback?.()
}


// ======================================================================================================================
const clearHistory = async (ioConnection, socket, callback = null) => {

    const chatId = socket.group_chat_connection_info?.chat_id || socket.private_chat_connection_info?.chat_id

    if(!chatId) return

    const deletedMessageIds = await clearUserHistory(chatId, socket.user_id)

    if (socket.group_chat_connection_info) {
        ioConnection.to(`chat-${chatId}`).emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.group_chat_connection_info.chat_type,
            },
            deleted_message_ids: deletedMessageIds
        })
    }
    else if (socket.private_chat_connection_info) {
        ioConnection.to(`user-${socket.private_chat_connection_info.target_user_id}`).emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.private_chat_connection_info.chat_type,
            },
            target_user_id: socket.user_id,
            deleted_message_ids: deletedMessageIds,
        })
        socket.emit("message-deleted", {
            chat: {
                _id: chatId,
                type: socket.private_chat_connection_info.chat_type,
            },
            target_user_id: socket.private_chat_connection_info.target_user_id,
            deleted_message_ids: deletedMessageIds,
        })
    }
    callback?.()
}


// ======================================================================================================================
const joinGroupChat = async (ioConnection, socket, password, callback) => {

    if (!socket.group_chat_connection_info) {
        callback?.('Invalid request')
        return
    }
    
    const chatId = socket.group_chat_connection_info.chat_id

    let chat, chatUser
    try {
        [chat, chatUser] = await joinGroup(chatId, socket.user_id, password)

        const userDeletedMessageIds = await getUserDeletedMessageIds(socket.user_id)

        const r = await createConversation(chat, chatUser, userDeletedMessageIds)

        socket.join(`chat-${chatId}`)

        socket.emit('new-chat', r)

        socket.group_chat_connection_info.is_member = true

        let message = await saveMessage(chatId, socket.user_id, `${socket.user.username} joined`, constants.ENUM_CHAT_MESSAGE_TYPE_NOTIFICATION)

        emitGroupChatNewMessage(ioConnection, chatId, message, socket.user)

        callback?.()
            
    }
    catch (err) {
        callback?.(err.message)
    }
}


// ======================================================================================================================
const leaveGroupChat = async (ioConnection, socket, callback) => {

    if (!socket.group_chat_connection_info) {
        callback?.('Invalid request')
        return
    }
    
    const chatId = socket.group_chat_connection_info.chat_id
    
    await ChatUser.findOneAndDelete({
        [constants.COL_CHAT_USER_CHAT_ID]: chatId,
        [constants.COL_CHAT_USER_USER_ID]: socket.user_id,
    })

    socket.group_chat_connection_info = undefined

    socket.leave(`chat-${chatId}`)

    socket.emit('left-group', chatId)

    callback?.()
}


// ======================================================================================================================
const deleteUserChats = async (ioConnection, socket, chatIds, callback) => {
    if (!chatIds) {
        callback('Select the chats you want to remove')
        return
    }

    chatIds = chatIds.split(',')

    if (chatIds.length == 0) {
        callback('Select the chats you want to remove')
        return
    }

    await ChatUser.deleteMany({
        [constants.COL_CHAT_USER_CHAT_ID]: {$in: chatIds},
        [constants.COL_CHAT_USER_USER_ID]: socket.user_id,
    })

    chatIds.forEach(chatId => {
        socket.leave(`chat-${chatId}`)
    })

    const connectedChatId = socket.group_chat_connection_info?.chat_id

    if (connectedChatId && chatIds.indexOf(connectedChatId) != -1) socket.group_chat_connection_info = undefined

    callback?.()
}


// ======================================================================================================================
const userBlocked = async (ioConnection, socket, userId, callback) => {
    if (socket.private_chat_connection_info) {
        if (socket.private_chat_connection_info.target_user_id != userId) {
            callback?.('Invalid request')
            return 
        }
        socket.private_chat_connection_info.blocked = true
        callback?.()
    }
}

// ======================================================================================================================
const userUnblocked = async (ioConnection, socket, userId, callback) => {
    if (socket.private_chat_connection_info) {
        if (socket.private_chat_connection_info.target_user_id != userId) {
            callback?.('Invalid request')
            return 
        }
        socket.private_chat_connection_info.blocked = false
        callback?.()
    }
}


// ======================================================================================================================
const disconnectFromChat = async (ioConnection, socket) => {

    let chatId
    if (socket.group_chat_connection_info) chatId = socket.group_chat_connection_info.chat_id 
    if (socket.private_chat_connection_info) {
        chatId = socket.private_chat_connection_info.chat_id
        stopListeningToPrivateChatTargetInfoChanges(socket, socket.private_chat_connection_info.target_user_id)
    }

    if(!chatId) return

    await ChatUser.findOneAndUpdate(
        {
            [constants.COL_CHAT_USER_USER_ID]: socket.user_id,
            [constants.COL_CHAT_USER_CHAT_ID]: chatId,
        },
        {
            [constants.COL_CHAT_USER_LAST_VISIT_DATE]: currentTimestamp()
        }
    )

    clearChatConnection(socket)
}

const clearChatConnection = (socket) => {
    if(socket.group_chat_connection_info) socket.group_chat_connection_info = undefined
    if(socket.private_chat_connection_info) socket.private_chat_connection_info = undefined
}


// ======================================================================================================================
const userOnlineStatusToggleHandler = async (ioConnection, socket, isOnline) => {
    await toggleUserOnlineStatus(socket.user_id, isOnline)
    socket.to(`private-chat-target-${socket.user_id}`).emit('online-status-changed', {
        user_id: socket.user_id,
        is_online: isOnline,
    })
}


// ======================================================================================================================
const connectionClosed = async (ioConnection, socket) => {
    disconnectFromChat(ioConnection, socket)
    userOnlineStatusToggleHandler(ioConnection, socket, false)
}





module.exports = {
    socketSendMessage,
    socketForwardMessage,
    userTyping,
    deleteMessage,
    clearHistory,
    joinGroupChat,
    leaveGroupChat,
    listenToChats,
    connectToGroupChat,
    connectToPrivateChat,
    deleteUserChats,
    disconnectFromChat,
    userBlocked,
    userUnblocked,
    connectionClosed,
    userOnlineStatusToggleHandler,
}