require('./dotenv')

module.exports = {

    // =====================================================================================================
    BASE_URL : process.env.BASE_URL,
    CLIENT_BASE_URL : process.env.CLIENT_BASE_URL,
    SUBDOMAIN_API : 'api/',
    DIR_USER_IMAGES : 'user-images/',
    DIR_CHAT_IMAGES : 'chat-images/',
    DIR_UPLOADS : 'uploads/',

    // =====================================================================================================
    COL_USER_ID : '_id',
    COL_USER_USERNAME : 'username',
    COL_USER_PASSWORD : 'password',
    COL_USER_IMAGE : 'image',
    COL_USER_IS_ONLINE : 'is_online',
    COL_USER_ACTIVE : 'active',


    // =====================================================================================================
    COL_CHAT_ID : '_id',
    COL_CHAT_TYPE : 'type',
    COL_CHAT_NAME : 'name',
    COL_CHAT_IMAGE : 'image',
    COL_CHAT_CUSTOM_ID : 'custom_id',
    COL_CHAT_PRIVACY_SETTING : 'privacy_setting',
    COL_CHAT_PRIVACY_SETTING_PRIVACY_TYPE : 'privacy_type',
    COL_CHAT_PRIVACY_SETTING_JOIN_TYPE : 'join_type',
    COL_CHAT_PRIVACY_SETTING_PASSWORD : 'password',
    COL_CHAT_ACTIVE : 'active',

    ENUM_CHAT_TYPE_PRIVATE:'private',
    ENUM_CHAT_TYPE_GROUP:'group',

    ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PUBLIC: 'public',
    ENUM_CHAT_PRIVACY_SETTING_PRIVACY_TYPE_PRIVATE: 'private',

    ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PUBLIC: 'public',
    ENUM_CHAT_PRIVACY_SETTING_JOIN_TYPE_PASSWORD: 'password',
    

    // =====================================================================================================
    COL_CHAT_USER_ID:'_id',
    COL_CHAT_USER_CHAT_ID:'chat_id',
    COL_CHAT_USER_USER_ID:'user_id',
    COL_CHAT_USER_IS_CREATOR:'is_creator',
    COL_CHAT_USER_IS_ADMIN:'is_admin',
    COL_CHAT_USER_MUTED:'muted',
    COL_CHAT_USER_TARGET_USER_ID:'target_user_id',
    COL_CHAT_USER_LAST_VISIT_DATE:'last_visit_date',
    COL_CHAT_USER_CREATED_AT:'createdAt',
    COL_CHAT_USER_UPDATED_AT:'updatedAt',


    // =====================================================================================================
    COL_CHAT_MESSAGE_ID:'_id',
    COL_CHAT_MESSAGE_CHAT_ID:'chat_id',
    COL_CHAT_MESSAGE_SENDER_ID:'sender_id',
    COL_CHAT_MESSAGE_FORWARDED_FROM_USER:'forwarded_from_user',
    COL_CHAT_MESSAGE_FORWARDED_FROM_MESSAGE:'forwarded_from_message',
    COL_CHAT_MESSAGE_TYPE:'type',
    COL_CHAT_MESSAGE_MESSAGE:'message',
    COL_CHAT_MESSAGE_DATE:'date',
    COL_CHAT_MESSAGE_TIME:'time',
    COL_CHAT_MESSAGE_CREATED_AT: 'createdAt',
    COL_CHAT_MESSAGE_UPDATED_AT: 'updatedAt',
    
    ENUM_CHAT_MESSAGE_TYPE_TEXT:'text',
    ENUM_CHAT_MESSAGE_TYPE_FILE:'file',
    ENUM_CHAT_MESSAGE_TYPE_NOTIFICATION:'notification',


    // =====================================================================================================
    COL_DELETED_MESSAGE_ID:'_id',
    COL_DELETED_MESSAGE_USER_ID:'user_id',
    COL_DELETED_MESSAGE_MESSAGE_ID:'message_id',


    // =====================================================================================================
    COL_BLOCK_ID:'_id',
    COL_BLOCK_USER_ID:'user_id',
    COL_BLOCK_BLOCKED_USER_ID:'blocked_user_id',

}