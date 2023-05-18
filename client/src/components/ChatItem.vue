<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import socketStore from '../stores/socketStore';
    import { ChatType, OnlineStatusEventData, UserTypingEventData } from '../types'


    const router = useRouter()
    const axios = useAxios()

    const props = defineProps<{
        chat: ChatType,
        selected?: boolean,
        selectedChatId?: string,
    }>()
    
    const image = ref()
    const name = ref()
    const typing = ref(false)
    const isUserOnline = ref(false)

   

    onMounted(()=>{
        if(props.chat.type == 'private' ){
            image.value = props.chat.target_user?.image
            name.value = props.chat.target_user?.username
            isUserOnline.value = props.chat.target_user?.is_online || false
        } else {
            image.value = props.chat.image
            name.value = props.chat.name
        }

        socketStore.socket?.on('user-typing', (data: UserTypingEventData)=>{
            if(props.selectedChatId == props.chat?._id) return
            
            if(data.chat?.type == 'group' ){
                if(data.chat?._id == props.chat._id ) typing.value = true
            }
            else if(data.chat?.type == 'private'){
                if(props.chat.target_user?._id == data.typing_user_id ) typing.value = true
            }
            
            setTimeout(()=>{
                typing.value = false
            },500)
        })

        socketStore.socket?.on('online-status-changed', (data: OnlineStatusEventData)=>{
            if (props.chat.type == 'private' && props.chat.target_user && data.user_id == props.chat.target_user._id) {
                isUserOnline.value = data.is_online
            }
        })

    })

    const lastMessage = computed(()=>{
        let lm = props.chat.last_message?.message as string
        if(lm.length > 25){
            return lm.slice(0, 25) + '...'
        }
        return lm
    })

</script>


<template>
    <div :class="['user-converstation display-flex align-items-center border-bottom-1px border-gray-light padding-2', props.selected ? 'chat--selected': '' ] ">
        <div class="position-relative">
            <img :src="image" style="width:40px; height:40px" class="rounded-circle" />
            <span v-if="isUserOnline" class="online-user-indicator"></span>
        </div>
        <div class="display-flex flex-column align-items-start margin-start-2 width-100">
            <div class="font-size-15px display-flex align-items-center justify-content-between width-100">
                <span>{{ name }}</span>
                <span 
                    v-if="props.chat.unread_messages_count > 0" 
                    class="unread-messages-count-badge rounded-circle background-secondary display-flex align-items-center justify-content-center font-size-12px">
                    {{ props.chat.unread_messages_count }}
                </span>
            </div>
            <span class="margin-top-1 font-size-15px text-gray" v-if="typing"> typing... </span>
            <div v-else class="margin-top-1 display-flex align-items-center justify-content-between width-100">
                <div>
                    <span v-if="props.chat?.last_message?.type == 'text' " class="font-size-15px text-gray">{{ lastMessage }}</span>
                    <span v-else-if="props.chat?.last_message?.type == 'file'" class="font-size-15px text-gray"> 
                        <i class="bi bi-file-earmark-fill"></i> file
                    </span>
                </div>
                <div class="font-size-12px text-primary">
                    {{ props.chat?.last_message?.time }}
                </div>
            </div>
        </div>
    </div>
</template>
