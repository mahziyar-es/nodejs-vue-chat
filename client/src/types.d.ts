
enum MessageTypes  {
    Text = 'text',
    File = 'file',
    Notification = 'notification',
}

enum ChatPrivacyTypes  {
    Public = 'public',
    Private = 'private',
}

enum ChatJoinTypes  {
    Public = 'public',
    Password = 'password',
}

type MessageType = {
    _id: string,
    message: string,
    sender_id: string,
    type: MessageTypes,
    date: string,
    time: string,
    user?: UserType,
    forwarded_from_message?: string,
    forwarded_from_user?: UserType,
}

type UserType = {
    _id: string,
    username: string,
    image: string,
    is_online: boolean = false,
}


type ChatType = {
    _id: string,
    type: string,
    name: string,
    image: string,
    unread_messages_count: number,
    is_member: number, // 0 or 1
    last_message_date?: string,
    last_message?: MessageType,
    target_user?: UserType,
    privacy_setting?: {
        privacy_type: ChatPrivacyTypes, 
        join_type: ChatJoinTypes, 
        password?: string, 
    },
}


type NewMessageEventData = {
    chat: ChatType,
    message: MessageType,
    sender_user: UserType,
    target_user?: UserType,
}


type MessageDeletedEventData = {
    chat:{
        _id: string,
        type: string,
    },
    deleted_message_ids : string[],
    target_user_id ?: string,
}


type UserTypingEventData = {
    chat:{
        _id: string,
        type: string,
    },
    typing_user_id ?: string
}

type BlockEventData = {
    user_id : string
}

type OnlineStatusEventData = {
    user_id : string,
    is_online : boolean,
}


export {
    MessageType,
    UserType,
    ChatType,
    NewMessageEventData,
    MessageDeletedEventData,
    UserTypingEventData,
    BlockEventData,
    OnlineStatusEventData,
}