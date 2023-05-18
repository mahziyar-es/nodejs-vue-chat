const ChatMessage = require("./models/ChatMessage")
const ChatUser = require("./models/ChatUser")
const User = require("./models/User")
const Chat = require("./models/Chat")
const constants = require('./utils/constants')
const bcrypt = require('bcrypt')
const { v4: uuid } = require('uuid')
const MongooseConnection = require("./mongooseConnection")


const dbConnection = new MongooseConnection()


dbConnection.connect(async () => {
    await seed()
    dbConnection.disconnect()
})


const seed = async() => {

    await ChatMessage.deleteMany({})
    await ChatUser.deleteMany({})
    await User.deleteMany({})

    for (let i = 1; i <= 10; i++){
        const user = new User({
            [constants.COL_USER_USERNAME]: `gamon${i}`, 
            [constants.COL_USER_PASSWORD]: await bcrypt.hash('123456', 5), 
            [constants.COL_USER_IMAGE]: 'ph.png', 
            [constants.COL_USER_ACTIVE]: true, 
        })

        await user.save() 
    }

    await Chat.deleteMany({})

    for (let i = 1; i <= 5; i++){
        const chat = new Chat({
            [constants.COL_CHAT_TYPE]: constants.ENUM_CHAT_TYPE_GROUP,
            [constants.COL_CHAT_NAME]: `group name ${i}`,
            [constants.COL_CHAT_IMAGE]: 'ph.png',
            [constants.COL_CHAT_CUSTOM_ID]: uuid(),
            [constants.COL_CHAT_PRIVACY_SETTING]: {
                [constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]: constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PUBLIC,
                [constants.COL_CHAT_PRIVACY_SETTING_PASSWORD]: '',
            },
        })

        await chat.save() 
    }

    for (let i = 1; i <= 5; i++){
        const privateChat = new Chat({
            [constants.COL_CHAT_TYPE]: constants.ENUM_CHAT_TYPE_GROUP,
            [constants.COL_CHAT_NAME]: `private group name ${i}`,
            [constants.COL_CHAT_IMAGE]: 'ph.png',
            [constants.COL_CHAT_CUSTOM_ID]: uuid(),
            [constants.COL_CHAT_PRIVACY_SETTING]: {
                [constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]: constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PASSWORD,
                [constants.COL_CHAT_PRIVACY_SETTING_PASSWORD]: await bcrypt.hash('123456', 5),
            },
        })

        await privateChat.save() 
    }

    console.log('Seeding done')
}
