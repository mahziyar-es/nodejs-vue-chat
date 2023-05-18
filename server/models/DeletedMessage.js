const constants = require('../utils/constants')
const mongoose = require('mongoose')
const { Schema, model } = mongoose


// this model is for the messages that user is not the sender but deleted 

const schema = new Schema(
    {
        [constants.COL_DELETED_MESSAGE_USER_ID]: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        [constants.COL_DELETED_MESSAGE_MESSAGE_ID]: {
            type: Schema.Types.ObjectId,
            ref: 'ChatMessage',
        },
    },
)


module.exports = model('DeletedMessage', schema)