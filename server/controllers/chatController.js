const constants = require('../utils/constants')
const { responseSuccess, uploadFile, deleteFile } = require('../utils/helpers')
const bcrypt = require('bcrypt')
const {v4:uuid} = require('uuid')
const expressAsyncHandler = require('express-async-handler')
const User = require('../models/User')
const ChatUser = require('../models/ChatUser')
const Chat = require('../models/Chat')
const ChatMessage = require('../models/ChatMessage')
const ErrorMessageException = require('../exceptions/errorMessageException')
const {getUserDeletedMessageIds} = require('./messageController')




// =====================================================================================================
const chats = async (req, res) => {
    const userChatMemberships = await ChatUser.find({
        [constants.COL_CHAT_USER_USER_ID]: req.user_id
    })
    .lean()
    .exec()
    
    let targetUserIds = {} // resembles the private chats
    let chatIds = [] // groups
    let chatIndexedChatUser = [] // groups

    userChatMemberships.forEach(chatUser => {

        const chatId = chatUser[constants.COL_CHAT_USER_CHAT_ID]
        const targetUserId = chatUser[constants.COL_CHAT_USER_TARGET_USER_ID]

        chatIds.push(chatId.valueOf())

        chatIndexedChatUser[chatId.valueOf()] = chatUser

        if (targetUserId) targetUserIds[chatId.valueOf()] = targetUserId.valueOf()
        
    })


    const chats = await Chat.find().where(constants.COL_CHAT_ID).in(chatIds)
        .select(`-${constants.COL_CHAT_PRIVACY_SETTING}.${constants.COL_CHAT_PRIVACY_SETTING_PASSWORD}`).exec()
    
    const targetUsers = await User.find().where(constants.COL_USER_ID).in(Object.values(targetUserIds)).select(`-${constants.COL_USER_PASSWORD}`).exec() 

    const userDeletedMessageIds = await getUserDeletedMessageIds(req.user_id)

    let response = []

    if(chats.length > 0){
        for (let i = 0; i < chats.length; i++) {
            const chat = chats[i]
            const chatUser = chatIndexedChatUser[chat[constants.COL_CHAT_ID].valueOf()]

            const r = await createConversation(chat, chatUser, userDeletedMessageIds, targetUsers, targetUserIds)

            response.push(r)
        }
    }

    response.sort((a, b) => {
        if (!a['last_message_date'] ) return 1
        if (!b['last_message_date'] ) return -1
            
        if(a['last_message_date'] < b['last_message_date']) return 1
        else if(a['last_message_date'] > b['last_message_date']) return -1
        else return 0
    })

    return responseSuccess(res, 'success', {
        chats: response,
    })
}


const createConversation = async (chat, chatUser, userDeletedMessageIds, targetUsers = null, targetUserIds = null) => {

    chatData = chat.toObject({getters: true})
    chatData.is_member = 1

    let r = {
        ...chatData
    }

    // getting last message of chat
    last_message = await ChatMessage.findOne({
        [constants.COL_CHAT_MESSAGE_CHAT_ID]: chat[constants.COL_CHAT_ID],
        [constants.COL_CHAT_MESSAGE_ID]: {$nin: userDeletedMessageIds},
    })
    .sort({
        [constants.COL_CHAT_MESSAGE_CREATED_AT]: -1
    })
    .limit(1).lean().exec()

    r['last_message'] = last_message || ''
    r['last_message_date'] = last_message?.[constants.COL_CHAT_MESSAGE_CREATED_AT]  || ''


    r['unread_messages_count'] = 0


    // getting target user if chat is one_to_ne
    if (chat[constants.COL_CHAT_TYPE] == constants.ENUM_CHAT_TYPE_PRIVATE) {
        const targetUserId = targetUserIds[chat[constants.COL_CHAT_ID]]
        targetUsers.map(targetUser => {
            if (targetUserId == targetUser[constants.COL_USER_ID]) r['target_user'] = targetUser
        })
    }
   
    
    r['unread_messages_count'] = await ChatMessage
        .where({
            [constants.COL_CHAT_MESSAGE_CHAT_ID]: chat[constants.COL_CHAT_ID],
            [constants.COL_CHAT_MESSAGE_SENDER_ID]: {$ne: chatUser[constants.COL_CHAT_USER_USER_ID]},
            [constants.COL_CHAT_MESSAGE_CREATED_AT]: {$gt: chatUser[constants.COL_CHAT_USER_LAST_VISIT_DATE]},
        })
        .countDocuments().exec()

    return r
}


// =====================================================================================================
const chat = expressAsyncHandler(async (req, res) => {
    let chatId = req.query.chat_id
    const targetUserId = req.query.target_user_id

    let response = {
        chat: undefined,
        target_user: undefined,
    }

    if (!chatId && !targetUserId) throw new ErrorMessageException('Invalid request')
    
    if (targetUserId && !chatId) {
        const targetUser = await User.findById(targetUserId).select(`-${constants.COL_USER_PASSWORD}`).exec() 

        if (!targetUser) throw new ErrorMessageException('User not found')

        response.target_user = targetUser

        chatId = await findOneToOneChat(req.user_id, targetUserId)
    }
    

    if (!chatId) {
        response.chat = {
            _id: undefined,
            type: constants.ENUM_CHAT_TYPE_PRIVATE,
        }
    }
    else {
        const chat = await Chat.findById(chatId).select(`-${constants.COL_CHAT_PRIVACY_SETTING}.${constants.COL_CHAT_PRIVACY_SETTING_PASSWORD}`).exec()
        
        if (!chat) throw new ErrorMessageException('Chat not found')

        response.chat = chat.toObject({ getters: true })

        const chatUser = await ChatUser.findOne({
            [constants.COL_CHAT_USER_CHAT_ID]: chat[constants.COL_CHAT_ID],
            [constants.COL_CHAT_USER_USER_ID]: req.user_id,
        }).lean().exec()
    
        if (chat[constants.COL_CHAT_TYPE] == constants.ENUM_CHAT_TYPE_GROUP) {
            if (chatUser) response.chat.is_member = 1
        }
        else if (!response.target_user && chat[constants.COL_CHAT_TYPE] == constants.ENUM_CHAT_TYPE_PRIVATE) {
            response.target_user = await User.findById(chatUser[constants.COL_CHAT_USER_TARGET_USER_ID]).select(`-${constants.COL_USER_PASSWORD}`).exec()
        }
    }

    return responseSuccess(res, 'success', response)
})


// =====================================================================================================
const group = expressAsyncHandler(async (req, res) =>{
    const groupId = req.params.id

    if(!groupId) throw new ErrorMessageException('Group not found')

    const chat = await Chat.findById(groupId).select(`-${constants.COL_CHAT_PRIVACY_SETTING}.${constants.COL_CHAT_PRIVACY_SETTING_PASSWORD}`).exec()

    if (!chat) throw new ErrorMessageException('Chat not found')
    
    const chatType = chat[constants.COL_CHAT_TYPE]
    const chatPrivacySettings = chat[constants.COL_CHAT_PRIVACY_SETTING]
    const chatJoinType = chatPrivacySettings[constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]

    const chatUser = await ChatUser.findOne({
        [constants.COL_CHAT_USER_CHAT_ID] : groupId,
        [constants.COL_CHAT_USER_USER_ID] : req.user_id,
    }).lean().exec()

    const members = await ChatUser.find({
        [constants.COL_CHAT_USER_CHAT_ID] : groupId,
    })
    .populate('user', [constants.COL_USER_ID, constants.COL_USER_USERNAME, constants.COL_USER_IMAGE])
    .exec()
    

    let response = {
        chat: chat.toObject({getters: true}),
        chat_user: chatUser,
        members : members
    }

    // if (chat[constants.COL_CHAT_TYPE] == constants.ENUM_CHAT_TYPE_PRIVATE) {
    //     response.target_user = await User.findById(chatUser[constants.COL_CHAT_USER_TARGET_USER_ID]).exec()
    // }

    // if (chatUser) {
    //     chat.is_member = 1
    // }

    return responseSuccess(res, 'success', response)
})


// =====================================================================================================
const createGroup = expressAsyncHandler( async (req, res)=> {
   
    let [name ,image ,privacyType ,joinType ,password] = await saveChatValidation(req)

    let chatImage = 'ph.png'

    if (image) chatImage = await uploadFile(image, constants.DIR_CHAT_IMAGES)
    
    if (password) password = await bcrypt.hash(password, 10)
    
    let customId = uuid()

    const chat = new Chat({
        [constants.COL_CHAT_TYPE]: constants.ENUM_CHAT_TYPE_GROUP,
        [constants.COL_CHAT_NAME]: name,
        [constants.COL_CHAT_IMAGE]: chatImage,
        [constants.COL_CHAT_CUSTOM_ID]: customId,
        [constants.COL_CHAT_PRIVACY_SETTING]: {
            [constants.COL_CHAT_PRIVACY_SETTING_PRIVACY_TYPE]: privacyType,
            [constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]: joinType,
            [constants.COL_CHAT_PRIVACY_SETTING_PASSWORD]: password,
        },
        [constants.COL_CHAT_ACTIVE]: true,
    })

    await chat.save()

    const chatUser = await new ChatUser({
        [constants.COL_CHAT_USER_CHAT_ID]: chat[constants.COL_CHAT_ID],
        [constants.COL_CHAT_USER_USER_ID]: req.user_id,
        [constants.COL_CHAT_USER_IS_CREATOR]: true,
        [constants.COL_CHAT_USER_IS_ADMIN]: true,
    }).save()


    return responseSuccess(res, 'success', {
        chat_id: chat[constants.COL_CHAT_ID]
    })
})


const saveChatValidation = async (req, chat = null) => {
    let name = req.body.name
    let image = req.files?.image
    let privacyType = req.body.privacy_type
    let joinType = req.body.join_type
    let password = req.body.password || ''

    if(!name) throw new ErrorMessageException('Enter the name')
    if(!privacyType) throw new ErrorMessageException('Enter privacy type')

    if (privacyType == constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PUBLIC) {
        joinType = constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PUBLIC
        password = ''
    }
        
    if(!joinType) throw new ErrorMessageException('Enter join type')
    if (joinType == constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PASSWORD && !password) throw new ErrorMessageException('Enter a password')
    
    if (joinType == constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PASSWORD) privacyType = constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PRIVATE
    if (joinType == constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PUBLIC) password = ''

    return [name ,image ,privacyType ,joinType ,password]
}
    

// =====================================================================================================
const updateGroup = expressAsyncHandler(async (req, res) => {
    const id = req.body.id
    
    if (!id) throw new ErrorMessageException('Group not found')
    
    const chat = await Chat.findById(id).lean().exec()

    if (!chat) throw new ErrorMessageException('Group not found')

    let [name, image, privacyType, joinType, password] = await saveChatValidation(req, chat)
    

    const chatUser = await ChatUser.findOne({
        [constants.COL_CHAT_USER_CHAT_ID]: id,
        [constants.COL_CHAT_USER_USER_ID]: req.user_id,
    }).lean().exec()

    if (!chatUser) throw new ErrorMessageException('Not allowed')
    
    if (!chatUser[constants.COL_CHAT_USER_IS_CREATOR]) throw new ErrorMessageException('Not allowed')

    chatImage = chat[constants.COL_CHAT_IMAGE]

    if (image) {
        chatImage = await uploadFile(image, constants.DIR_CHAT_IMAGES)
        await deleteFile(constants.DIR_CHAT_IMAGES, chat[constants.COL_CHAT_IMAGE])
    }
    
    if (password) password = await bcrypt.hash(password, 10)
    
    
    await Chat.findOneAndUpdate(
        {
            [constants.COL_CHAT_ID]: id,
        },
        {
            [constants.COL_CHAT_NAME]: name,
            [constants.COL_CHAT_IMAGE]: chatImage,
            [constants.COL_CHAT_PRIVACY_SETTING]: {
                [constants.COL_CHAT_PRIVACY_SETTING_PRIVACY_TYPE]: privacyType,
                [constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]: joinType,
                [constants.COL_CHAT_PRIVACY_SETTING_PASSWORD]: password,
            },
            [constants.COL_CHAT_ACTIVE]: true,
        }
    )

    return responseSuccess(res, 'success', {
        chat: chat
    })
})


// =====================================================================================================
const createOneToOneChat = async (userId, targetUserId) => {
   
    const chat = new Chat({
        [constants.COL_CHAT_TYPE]: constants.ENUM_CHAT_TYPE_PRIVATE,
    })
    await chat.save()

    chatId = chat[constants.COL_CHAT_ID]
   
    return chat
}


// =====================================================================================================
const findOneToOneChat = async (userId, targetUserId) => {
        
    let userChat
    let userChat2

    userChat = await ChatUser.findOne({
        [constants.COL_CHAT_USER_USER_ID] : userId,
        [constants.COL_CHAT_USER_TARGET_USER_ID] : targetUserId,
    }).lean().exec()
        
    let chatId

    if (userChat) {
        chatId = userChat[constants.COL_CHAT_USER_CHAT_ID]
    }
    else{
        userChat2 = await ChatUser.findOne({
            [constants.COL_CHAT_USER_USER_ID] : targetUserId,
            [constants.COL_CHAT_USER_TARGET_USER_ID] : userId,
        }).lean().exec()

        if(userChat2) chatId = userChat2[constants.COL_CHAT_USER_CHAT_ID]
    }

    return chatId
}


// =====================================================================================================
const createoneToOneChatUsers = async(chatId, userId, targetUserId) => {
    await ChatUser.findOneAndUpdate(
        {
            [constants.COL_CHAT_USER_CHAT_ID]: chatId,
            [constants.COL_CHAT_USER_USER_ID]: targetUserId,
            [constants.COL_CHAT_USER_TARGET_USER_ID]: userId,
        },
        {},
        {upsert: true},
    )

    await ChatUser.findOneAndUpdate(
        {
            [constants.COL_CHAT_USER_CHAT_ID]: chatId,
            [constants.COL_CHAT_USER_USER_ID]: userId,
            [constants.COL_CHAT_USER_TARGET_USER_ID]: targetUserId,
        },
        {},
        {upsert: true},
    )
}


// =====================================================================================================
const joinGroup = async(chatId, userId, password) => {
    const chat = await Chat.findById(chatId).exec()

    const chatPrivacySettings = chat[constants.COL_CHAT_PRIVACY_SETTING]
    const chatJoinType = chatPrivacySettings[constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]
    const chatPassword = chatPrivacySettings[constants.COL_CHAT_PRIVACY_SETTING_PASSWORD]

    const chatUserExists = await ChatUser.findOne({ 
        [constants.COL_CHAT_USER_CHAT_ID]: chatId,
        [constants.COL_CHAT_USER_USER_ID]: userId,
    }).lean().exec()

    if (chatUserExists) throw new ErrorMessageException('You are a member')
    
    if (chatJoinType == constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PASSWORD) {
        if (!password) throw new ErrorMessageException('Provide a password') 
        const passwordsMatch = await bcrypt.compare(password, chatPassword)
        if (!passwordsMatch) throw new ErrorMessageException('Incorrect password') 
    } 

    const chatUser = new ChatUser({
        [constants.COL_CHAT_USER_CHAT_ID]: chatId,
        [constants.COL_CHAT_USER_USER_ID]: userId,
        [constants.COL_CHAT_USER_LAST_VISIT_DATE]: Date.now(),
    })
    await chatUser.save()

    return [chat, chatUser]
}




module.exports = {
    chats,
    chat,
    createConversation,
    group,
    createGroup,
    updateGroup,
    createOneToOneChat,
    findOneToOneChat,
    createoneToOneChatUsers,
    joinGroup,
}