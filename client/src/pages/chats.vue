<script setup lang="ts">
    import {onMounted, ref, watch} from 'vue'
    import { useRouter } from 'vue-router'
    import GeneralSettings from '../components/GeneralSettings.vue'
    import ChatItem from '../components/ChatItem.vue'
    import GeneralSearch from '../components/GeneralSearch.vue'
    import Chat from '../components/Chat.vue'
    import useAxios from '../composeables/useAxios';
    import {Gamon} from 'gamon-vue'
    import userChatsStore from '../stores/userChatsStore';
    import socketStore from '../stores/socketStore';
    import { isSmallScreen } from '../utils'
    import { UserType, ChatType, MessageType, NewMessageEventData } from '../types'


    
    const router = useRouter()
    const axios = useAxios()
    const loadingChat = ref(false)
    const chatSelected = ref(false)
    const chats = ref<ChatType[]>([])
    const openedChatProps = ref<{
        chat: ChatType,
        target_user?: UserType,
    }>()
    const selectedChatIds = ref<string[]>([])

    
    onMounted(async ()=>{
        socketStore.connect()
        chats.value = await userChatsStore.chatsList(true)
        listenToChats()
        listenToSocketEvents()
    })  


    const listenToChats = ()=>{
        let groupIds : string[] = []
        let targetUserIds : string[] = []
        chats.value.map(chat=>{
            if(chat.type == 'private' && chat?.target_user) targetUserIds.push(chat.target_user._id)
            else if(chat.type == 'group') groupIds.push(chat._id)
        })
        socketStore.socket.emit('listen-to-chats', groupIds.join(','), targetUserIds.join(','))
    }

    const listenToSocketEvents = ()=>{
        
        socketStore.socket?.on('new-message', (data : NewMessageEventData)=>{
            
            let foundIndex = -1
            chats.value.forEach((chat, index)=>{
                if(chat._id == data.chat._id) foundIndex = index
            })

            if(foundIndex != -1){
                const chat = chats.value[foundIndex]
                chat.last_message = data.message
                chats.value.splice(foundIndex, 1)
                chats.value.unshift(chat)

                if(!chat.unread_messages_count) chat.unread_messages_count = 0

                if(!chatIsOpen(data.chat._id, data?.target_user?._id)) chat.unread_messages_count += 1
            } 
            else{
                if(data.chat.type == 'private'){
                    const newChat = {
                        ...data.chat,
                        is_member: 1,
                        last_message: data.message,
                        target_user: data.target_user,
                        unread_messages_count: 1,
                    }
                    addNewChat(newChat)
                }
            }

        })

        socketStore.socket?.on('new-chat', (data: ChatType)=>{
            chats.value.unshift(data)
        })

        socketStore.socket?.on('left-group', (chatId: string)=>{
            removeChatsFromList(chatId)
        })
        
    }

    const openChatWithTarget = (chat:ChatType, user?:UserType)=>{
        if (isSmallScreen()) {
            if(chat._id)
                router.push('/chat/'+chat._id)
            else if(user?._id)
                router.push({path:'/chat', query:{ target_user_id: user._id }})
        }
        else {
            loadingChat.value = true 

            let chatPropsData = {
                chat: chat,
                target_user: user,
            }

            openedChatProps.value = chatPropsData

            setTimeout(() => {
                loadingChat.value = false 
                chatSelected.value = true 
                chat.unread_messages_count = 0
            }, 500);
        }
    }

    const addNewChat = (chat : ChatType)=>{
        chats.value.unshift(chat)
    }

    const removeChatsFromList = (chatIds: string[] | string  )=>{

        if(!Array.isArray(chatIds)) chatIds = [chatIds]

        if(openedChatProps.value?.chat && chatIds.indexOf(openedChatProps.value?.chat?._id) != -1){
            chatSelected.value = false
            openedChatProps.value = undefined
        }

        const chatsList = chats.value
        chats.value = chatsList.filter(chat=> {
            return chatIds.indexOf(chat._id) == -1
        })
    }

    const changeLastMessage = (newLastMessage:any)=>{
        chats.value.forEach((chat, index)=>{
            if(chat._id == newLastMessage.chat_id) {
                chat.last_message = newLastMessage
            }
        })
    }

    const chatClickHandler = (chat:ChatType, user?:UserType)=>{
        if(selectedChatIds.value.length > 0) chatSelection(chat._id)
        else openChatWithTarget(chat, user)
    }

    const chatSelection = (chatId: string)=>{
        const index = selectedChatIds.value.indexOf(chatId)
        if(index == -1) selectedChatIds.value.push(chatId)
        else selectedChatIds.value.splice(index, 1)
    }

    const deSelectChats = ()=>{
        selectedChatIds.value = []
    }

    const deleteSelectedChats = ()=>{
        socketStore.socket.emit('delete-user-chats', selectedChatIds.value.join(','), (err?: string)=>{
            if(err){
                Gamon.notify(err, 'error')
                return
            }
            removeChatsFromList(selectedChatIds.value)
            selectedChatIds.value = []
        })
    }

    const chatIsOpen = (chatId:string, targetUserId?:string)=>{

        const chatIdsMatch = openedChatProps.value?.chat && openedChatProps.value.chat._id == chatId
        const targetUsersMatch = targetUserId && openedChatProps.value?.target_user && openedChatProps.value.target_user._id == targetUserId

        if(chatIdsMatch || targetUsersMatch) return true 
        return false
    }

</script>


<template>
    <div class="overflow-hidden" style="height:100vh">
        <Row class="height-100">


            <!-- chats -->
            <Col width="lg-3 md-4 display-flex flex-column padding-4 background" class="height-100">
                <div>
                    <div v-if="selectedChatIds.length > 0" class="width-100 display-flex align-items-center justify-content-between">
                       <span> {{ selectedChatIds.length }} chat(s) selected </span>
                       <span class="display-flex align-items-center"> 
                           <i class="bi bi-trash text-primary font-size-18px margin-end-2 cursor-pointer" @click="deleteSelectedChats()"></i>
                           <i class="bi bi-x text-primary font-size-25px cursor-pointer" @click="deSelectChats()"></i>
                        </span>
                   </div>
                    <div v-else class="width-100 display-flex align-items-center justify-content-between">
                        <div class="display-flex align-items-center">
                            <GeneralSettings />
                            <span class="text-primary margin-start-2">{{ socketStore.connected ? 'Connected' : 'Connecting...' }}</span>
                        </div>
                        <GeneralSearch @select="openChatWithTarget" />
                    </div>
                </div>
                <div class="height-100 overflow-y-auto margin-top-5">
                    <ChatItem 
                        v-for="chat in chats" 
                        :key="chat._id" 
                        :chat="chat"
                        :selected="selectedChatIds.indexOf(chat._id) != -1"
                        :selectedChatId="openedChatProps?.chat?._id" 
                        v-custom-click="{
                            click_callback: ()=>chatClickHandler(chat, chat.target_user),
                            long_click_callback: ()=>chatSelection(chat._id),
                            long_click_duration: '1000',
                        }"
                    />

                    <div v-if="chats.length == 0" class="rounded-1 text-primary padding-1">
                        <p>You can search for other users and groups to start chatting...</p>
                    </div>

                </div>
            </Col>
            <!-- / -->




            <Col width="lg-9 md-8 sm-display-none display-flex height-100 overflow-hidden background-primary padding-4">

                <div v-if="chatSelected" class="width-100 height-100">
                    <div v-if="loadingChat" class="width-100 height-100 display-flex flex-column align-items-center justify-content-center">
                        <Loading type="dual-ring" />
                        <h2 >Loading...</h2>
                    </div>
                    <Chat 
                        v-else
                        :chat="openedChatProps!.chat"
                        :user="openedChatProps!.target_user"
                        @last-message-changed="changeLastMessage"
                    />
                </div>

                <div v-else class="width-100 height-100 display-flex flex-column align-items-center justify-content-center">
                    <Loading type="cradle" />
                    <h2 >Select a chat to start messaging</h2>
                </div>
                
            </Col>


       </Row>
   </div>
</template>
