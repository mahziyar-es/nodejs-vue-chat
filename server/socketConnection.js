const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const constants = require('./utils/constants')
const User = require('./models/User')
const {requestLogger, getCookieValue, uploadFile, deleteFile, currentTimestamp} = require('./utils/helpers')
const { socketSendMessage, socketForwardMessage, userTyping, deleteMessage, 
    clearHistory, disconnectFromChat, joinGroupChat, leaveGroupChat,
    listenToChats, connectToGroupChat, connectToPrivateChat, deleteUserChats, userBlocked ,userUnblocked, connectionClosed, userOnlineStatusToggleHandler } = require('./controllers/socketController')
const { toggleUserOnlineStatus } = require('./controllers/userController')


const ioConnection = (httpServer) => {
    
    const io = new Server(httpServer, {
        cors: {
            origin: [constants.CLIENT_BASE_URL]
        },
        cookie: true
    })
    

    const ioChatConnection = io.of('/chat')
    ioChatConnection.use(async (socket, next) => {

        if(!socket.handshake.query || !socket.handshake.headers.cookie) return next(new Error('Error: invalid request'))

        // extract api token from cookies
        let apiToken
        try {
            apiToken =  await getCookieValue(socket.handshake.headers.cookie, 'access_token')
        } catch (error) {
            next(new Error('Access token not provided'))
        }


        // verify api token
        let decodedApiToken
        try {
            decodedApiToken = jwt.verify(apiToken, process.env.JWT_SECRET)
        } catch (error) {
            next(new Error('Authentication failed'))
        }
        if (!decodedApiToken || !decodedApiToken.id) return next(new Error('Authentication failed 2'))


        // init socket data
        socket.user_id = decodedApiToken.id
        socket.blocked_by_user_ids = []
        socket.blocked_in_chat_ids = []
        socket.user = await User.findById(socket.user_id).select(`${constants.COL_USER_ID} ${constants.COL_USER_USERNAME} ${constants.COL_USER_IMAGE}`).exec()


        next()
    })
    ioChatConnection.on('connection', async (socket) => {

        console.log('user connected')

        socket.join(`user-${socket.user_id}`)

        userOnlineStatusToggleHandler(ioChatConnection, socket, true)

        socket.on('listen-to-chats', (groupIds, targetUserIds, callback = null) => listenToChats(ioChatConnection, socket, groupIds, targetUserIds, callback))
        
        socket.on('connect-to-group-chat', (chatId, callback = null) => connectToGroupChat(ioChatConnection, socket, chatId, callback))
        
        socket.on('connect-to-private-chat', (userId, callback = null)=> connectToPrivateChat(ioChatConnection, socket, userId, callback))
            
        socket.on('send-message', (newMessage, callback = null) => socketSendMessage(ioChatConnection, socket, newMessage, callback))
        
        socket.on('forward-message', (chatId, messageId, callback = null)=>socketForwardMessage(ioChatConnection, socket, chatId, messageId, callback))

        socket.on('user-typing', ()=> userTyping(ioChatConnection, socket))

        socket.on('delete-message', (messageIds, callback = null)=>deleteMessage(ioChatConnection, socket, messageIds, callback))

        socket.on('clear-history', (callback=null)=>clearHistory(ioChatConnection, socket, callback))
       
        socket.on('join-group', (password = null, callback = null) => joinGroupChat(ioChatConnection, socket, password, callback))

        socket.on('leave-group', (callback = null) => leaveGroupChat(ioChatConnection, socket, callback))

        socket.on('disconnect-from-chat', () => disconnectFromChat(ioChatConnection, socket))

        socket.on('delete-user-chats', (chatIds, callback = null) => deleteUserChats(ioChatConnection, socket, chatIds, callback))

        socket.on('blocked', (userId, callback = null) => userBlocked(ioChatConnection, socket, userId, callback))

        socket.on('unblocked', (userId, callback = null) => userUnblocked(ioChatConnection, socket, userId, callback))
        
        socket.on('disconnect', () => connectionClosed(ioChatConnection, socket))
        
    })

    return ioChatConnection
}


module.exports = ioConnection