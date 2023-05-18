const constants = require('../utils/constants')
const User = require('./User')
const mongoose = require('mongoose')
const { Schema, model } = mongoose


const schema = new Schema(
    {

        [constants.COL_CHAT_MESSAGE_CHAT_ID]: {
            type: Schema.Types.ObjectId,
            ref: 'Chat'
        },
        [constants.COL_CHAT_MESSAGE_SENDER_ID]: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        [constants.COL_CHAT_MESSAGE_FORWARDED_FROM_USER]: {
            type: Schema.Types.ObjectId,
            default: null,
            ref: 'User',
        },
        [constants.COL_CHAT_MESSAGE_FORWARDED_FROM_MESSAGE]: {
            type: Schema.Types.ObjectId,
            default: null,
            ref: 'ChatMessage'
        },
        [constants.COL_CHAT_MESSAGE_TYPE]: {
            type: String,
            enum: [constants.ENUM_CHAT_MESSAGE_TYPE_TEXT, constants.ENUM_CHAT_MESSAGE_TYPE_FILE, constants.ENUM_CHAT_MESSAGE_TYPE_NOTIFICATION],
            default: constants.ENUM_CHAT_MESSAGE_TYPE_TEXT,
        },
        [constants.COL_CHAT_MESSAGE_MESSAGE]: {
            type: String,
            get: messageGetter
        },
        [constants.COL_CHAT_MESSAGE_DATE]: String,
        [constants.COL_CHAT_MESSAGE_TIME]: String,
               
    },
    {
        timestamps: true, 
        toJSON: { getters: true },
        toObject: { getters: true },
    },
)



function messageGetter(message) {
    if (this.type == constants.ENUM_CHAT_MESSAGE_TYPE_FILE) return constants.BASE_URL + constants.DIR_UPLOADS + message
    return message
}




module.exports = model('ChatMessage', schema)