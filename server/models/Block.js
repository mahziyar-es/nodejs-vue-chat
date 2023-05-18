const constants = require('../utils/constants')
const mongoose = require('mongoose')
const { Schema, model } = mongoose


const schema = new Schema(
    {
        [constants.COL_BLOCK_USER_ID]: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        [constants.COL_BLOCK_BLOCKED_USER_ID]: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
)

module.exports = model('Block', schema)