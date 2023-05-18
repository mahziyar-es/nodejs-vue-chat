const constants = require('../utils/constants')
const mongoose = require('mongoose')
const { Schema, model } = mongoose


const chatSchema = new Schema({

    [constants.COL_CHAT_TYPE]: {
        type:String,
        enum: [constants.ENUM_CHAT_TYPE_PRIVATE, constants.ENUM_CHAT_TYPE_GROUP],
        default: constants.ENUM_CHAT_TYPE_PRIVATE
    },
    [constants.COL_CHAT_NAME]: {
        type: String,
        required: false
    },
    [constants.COL_CHAT_IMAGE]: {
        type: String,
        required: false,
        get: imageGetter
    },
    [constants.COL_CHAT_CUSTOM_ID]: {
        type: String,
        required: false,
    },
    [constants.COL_CHAT_PRIVACY_SETTING]: {
        [constants.COL_CHAT_PRIVACY_SETTING_PRIVACY_TYPE]: {
            type: String,
            enums: [constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PUBLIC, constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PRIVATE],
            default: constants.ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PUBLIC,
        },
        [constants.COL_CHAT_PRIVACY_SETTING_JOIN_TYPE]: {
            type: String,
            enums: [constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PUBLIC, constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PASSWORD],
            default: constants.ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PUBLIC,
        },
        [constants.COL_CHAT_PRIVACY_SETTING_PASSWORD]: String
    },
    [constants.COL_CHAT_ACTIVE]: {
        type: Boolean,
        default: true,
    },

},
{
    toJSON: { getters: true },
    toObject: { getters: true },
}
)




function imageGetter(image) {
    if(!image) return image
    return constants.BASE_URL + constants.DIR_CHAT_IMAGES + image
}



module.exports = model('Chat', chatSchema)