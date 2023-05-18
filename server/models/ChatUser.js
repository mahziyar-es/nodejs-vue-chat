const constants = require('../utils/constants')
const mongoose = require('mongoose')
const { Schema, model } = mongoose


const chatUserSchema = new Schema({

    [constants.COL_CHAT_USER_CHAT_ID]: {
        type: Schema.Types.ObjectId,
        ref: 'Chat'
    },
    [constants.COL_CHAT_USER_USER_ID]: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    [constants.COL_CHAT_USER_IS_CREATOR]: {
        type: Boolean,
        default: false,
    },
    [constants.COL_CHAT_USER_IS_ADMIN]: {
        type: Boolean,
        default: false,
    },
    [constants.COL_CHAT_USER_MUTED]: {
        type: Boolean,
        default: false,
    },
    [constants.COL_CHAT_USER_TARGET_USER_ID]: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required:false,
    },
    [constants.COL_CHAT_USER_LAST_VISIT_DATE]: {
        type: Date,
        required: false,
        default: Date.now()
    },

},
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    }
)


chatUserSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id', 
    foreignField: '_id',
    justOne: true,
});

module.exports = model('ChatUser', chatUserSchema)
