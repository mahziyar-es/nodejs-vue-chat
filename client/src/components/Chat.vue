<script setup lang="ts">
    import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
    import { useRouter } from 'vue-router'
    import useAxios from '../composeables/useAxios';
    import ChatOptionsSheet from './ChatOptionsSheet.vue';
    import JoinGroupSection from './JoinGroupSection.vue';
    import ChatTarget from './ChatTarget.vue';
    import Message from './Message.vue';
    import MessageInput from './MessageInput.vue';
    import userStore from '../stores/userStore';
    import socketStore from '../stores/socketStore';
    import { UserType, ChatType, MessageType, NewMessageEventData, MessageDeletedEventData, BlockEventData } from '../types'


    const router = useRouter()
    const axios = useAxios()

    const emits = defineEmits(['lastMessageChanged'])
    const props = defineProps<{
        chat : ChatType,
        user ?: UserType,
    }>()

    const chatBox = ref<HTMLDivElement>()
    const messages = ref<MessageType[]>([])
    const selectedMessagesIds = ref<string[]>([])
    const senderUsers = ref<UserType[]>([])
    const viewerUser = ref<UserType>()
    const target = ref({
        _id: '',
        type: '', // user and group
        name: '',
        image: '',
        is_online: false, // only for users
    })
    const showInput = ref(true)
    const chat = ref(props.chat)
    const targetUser = ref(props.user)
    const connectionError = ref('')
    

    onMounted(async ()=>{
        viewerUser.value = await userStore.getUser()
        init()
        listenToSocketEvents()
    })


    onBeforeUnmount(()=>{
        socketStore.socket.emit('disconnect-from-chat')
    })


    const init = async ()=>{
        if(chat.value.type == 'private' && targetUser.value){
            target.value.name = targetUser.value.username
            target.value.image = targetUser.value.image
            target.value._id = targetUser.value._id
            target.value.is_online = targetUser.value.is_online
            target.value.type = 'user'

            if(chat.value._id) getMessages()

            socketStore.socket.emit('connect-to-private-chat', target.value._id, (err = null) => {
                if (err) {
                    connectionError.value = err
                    return
                }
            })
        } 
        else {
            target.value.name = chat.value.name
            target.value.image = chat.value.image
            target.value._id = props.chat._id
            target.value.type = props.chat.type

            if(chat.value.is_member == 1) {
                getMessages()
                showInput.value = true
            } else {
                showInput.value = false
                if(chat.value.privacy_setting?.privacy_type == 'public') {
                    getMessages()
                }
            }

            socketStore.socket.emit('connect-to-group-chat', target.value._id, (err = null) => {
                if (err) {
                    connectionError.value = err
                    return
                }
            })
        }
    }

    const listenToSocketEvents = ()=>{
        
        socketStore.socket?.on('new-message', (data: NewMessageEventData)=>{
            if(isThisChat(data.chat?._id, data.target_user?._id)) addNewMessageToMessages(data.message, data.sender_user)
        })

        socketStore.socket?.on('message-deleted', (data : MessageDeletedEventData)=>{
            const ids = data.deleted_message_ids

            if(isThisChat(data?.chat?._id, data.target_user_id)){
                const lastMessageId = messages.value[messages.value.length - 1]._id
                const remainingMessages = messages.value.filter(m=> ids.indexOf(m._id) == -1)
                messages.value = remainingMessages
                if(ids.indexOf(lastMessageId) != -1) emits('lastMessageChanged', messages.value[messages.value.length - 1])
            }
        })
        
        socketStore.socket?.on('blocked', (data: BlockEventData) => {
            if (isThisChat(undefined, data.user_id)) {
                connectionError.value = 'Blocked'
                socketStore.socket?.emit('blocked', data.user_id)
            }
        })

        socketStore.socket?.on('unblocked', (data: BlockEventData) => {
            if (isThisChat(undefined, data.user_id)) {
                connectionError.value = ''
                socketStore.socket?.emit('unblocked', data.user_id)
            }
        })
    }   


    const isThisChat = (chatId?: string, targetUserId?: string)=>{
        const chatIdsMatch = chatId && chat.value?._id && (chat.value._id == chatId)
        const targetUserMatch = targetUserId && targetUser.value?._id && (targetUser.value?._id == targetUserId)

        if(chatIdsMatch || targetUserMatch) return true 
        return false
    }

    const getMessages = ()=>{
        if(!chat.value._id) return

        const count = messages.value.length

        axios.get('message',{
            params:{
                chat_id: chat.value._id,
                count: count,
            }
        })
        .then(res=>{
            messages.value.unshift(...res.data.messages)
            senderUsers.value.push(...res.data.users)
            attachSenderToMessage()
            if(count == 0) scrollChatBoxToEnd()
        })
    }

    const attachSenderToMessage = ()=>{
        messages.value.forEach(message=>{
            message['user'] = senderUsers.value.find(user=>{
                return user._id == message.sender_id
            })
        })
    }

    const addNewMessageToMessages = (message: MessageType, user:UserType)=>{
        message['user'] = user
        messages.value.push(message)
        scrollChatBoxToEnd()
    }

    const scrollChatBoxToEnd = ()=> {
        setTimeout(() => {
            chatBox.value?.scroll(0, chatBox.value.scrollHeight)
        }, 20);
    }

    const chatBoxScroll = ()=>{
        const scrollHeight = chatBox.value!.scrollHeight
        const scrollTop = chatBox.value!.scrollTop
        const diff = scrollHeight - scrollTop  
        if(diff == scrollHeight ) getMessages()
    }

    const messageSelection = (message:MessageType)=>{
        messageSelectionHandler(message)
    }

    const messageClicked = (message:MessageType)=>{
        if(selectedMessagesIds.value.length == 0) return 
        messageSelectionHandler(message)
    }

    const messageSelectionHandler = (message:MessageType) => {
        const idIndex = selectedMessagesIds.value.indexOf(message._id)
        if(idIndex == -1) selectedMessagesIds.value.push(message._id)
        else selectedMessagesIds.value.splice(idIndex, 1)
    }

    const unSelectMessages = ()=>{
        selectedMessagesIds.value = []
    }

    const deleteMessages = ()=>{
        if(selectedMessagesIds.value.length == 0) return
        socketStore.socket.emit('delete-message', selectedMessagesIds.value, ()=>{
            selectedMessagesIds.value = []
        })
    }

    

</script>


<template>
    <div v-if="viewerUser" class="chat-component display-flex flex-column height-100 background-primary position-relative">

        <!-- target -->
        <div class="chat-component__target_container height-fit-content background-primary display-flex flex-column align-items-center padding-2 border-bottom-1px">

            <div class="display-flex align-items-center justify-content-between width-100">
                <ChatTarget
                    :targetId="target._id"
                    :targetType="target.type"
                    :targetName="target.name"
                    :targetImage="target.image"
                    :targetIsOnline="target.is_online"
                />

                <ChatOptionsSheet
                    :chatId="chat._id"
                    :chatType="chat.type"
                    :targetId="target._id"
                />
            </div>

            <div v-if="selectedMessagesIds.length > 0" class="display-flex align-items-center justify-content-between width-100 margin-top-3 text-secondary">
                <div>
                    <span >{{selectedMessagesIds.length}}</span> 
                    <span> message(s) selected</span> 
                </div>
                <div class="display-flex align-items-center">
                    <i class="bi bi-trash-fill text-red margin-start-5 cursor-pointer margin-end-5" @click="deleteMessages()"></i>
                    <i @click="unSelectMessages()" class="bi bi-x text-red cursor-pointer font-size-25px"></i>
                </div>
            </div>
        
        </div>
        <!-- / -->



        <!-- messages -->
        <div  class="chat-component__message_container flex-fill width-100 overflow-auto  padding-2 display-flex flex-column chatbox" @scroll.passive="chatBoxScroll()" ref="chatBox">
            <Message
                v-for="(message) in messages"
                :key="message._id" 
                :socket="socketStore.socket"
                :message="message"
                :viewerUser="viewerUser"
                :selected="selectedMessagesIds.indexOf(message._id) != -1"


                @message-clicked="()=>messageClicked(message)"
                @message-selected="()=>messageSelection(message)"
            />
        </div>
        <!-- / -->



        <!-- input -->
        <div class="chat-component__input_container height-fit-content">
            <div v-if="connectionError" class="display-flex align-items-center justify-content-center text-secondary padding-2">
                {{ connectionError }}
            </div>
            <div v-else>
                <MessageInput 
                    v-if="showInput"
                    :socket="socketStore.socket"
                    :chatId="chat?._id"
                    :targetUserId="targetUser?._id"
                />
                <JoinGroupSection 
                    v-else  
                    :chat="chat"
                    :on-joined="()=>showInput=true"
                />
            </div>
        </div>
        <!-- / -->
   


    </div>
</template>
