const constants = require('../utils/constants')
const mongoose = require('mongoose')
const { Schema, model } = mongoose


const schema = new Schema({
    [constants.COL_USER_USERNAME]: String,
    [constants.COL_USER_PASSWORD]: String,
    [constants.COL_USER_IMAGE]: {
        type: String,
        default: '',
        get: imageGetter
    },
    [constants.COL_USER_IS_ONLINE]: {
        type: Boolean,
        default: false,
    },
    [constants.COL_USER_ACTIVE]: {
        type: Boolean,
        default: true,
    },
},
{
    toJSON: { getters: true },
    toObject: { getters: true },
},
);


function imageGetter(image) {
    if(!image) return constants.BASE_URL + constants.DIR_USER_IMAGES + 'ph.png'
    return constants.BASE_URL + constants.DIR_USER_IMAGES + image
}


module.exports = model('User', schema)