<script setup lang="ts">
    import { ref, watch } from 'vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
import { isSmallScreen } from '../utils'

    const router = useRouter()
    const axios = useAxios()


    const emits = defineEmits(['typing', 'sendMessage'])
    const props = defineProps<{
       socket: any,
       chatId?: string,
       targetUserId?: string,
    }>()

    const chatMessageInput = ref()
    const fileInput = ref<HTMLInputElement>()
    const message = ref<string>()


    watch(message, ()=>{
        chatMessageInput.value.style.height = 0
        if(message.value == '') return
        chatMessageInput.value.style.height = chatMessageInput.value.scrollHeight +'px'
    })


    const openFileBrwoser = ()=> {
        fileInput.value!.click()
    }

    const uploadFile = (e: InputEvent)=>{
        const target = e.target as HTMLInputElement
        if(!target) return
        const file = target.files![0]

        let formData = new FormData()
        formData.append('file', file)
        formData.append('chat_id', props.chatId || '')
        formData.append('target_user_id', props.targetUserId || '')

        axios.post('message/upload', formData,{

        })

        sendMessage()
    }
    
    const inputKeyPressHandler = (e: KeyboardEvent) => {
        e.stopPropagation()

        if (isSmallScreen()) {
            typing()
        }
        else {
            if(e.key == 'Enter') sendMessage()
            else if(e.key == '\n') message.value = (message.value == undefined ? '' : message.value) + '\r\n'
            else typing()
        }
    }
    
    const typing = ()=>{
        props.socket.emit('user-typing')
    }

    const sendMessage = ()=>{
        if(message.value == '' || message.value == null || message.value == undefined) {
            clearInput()
            return
        }

        if(props.chatId) props.socket.emit('send-message', message.value)

        else if(props.targetUserId) props.socket.emit('send-message', message.value)

        clearInput()
    }

    const clearInput = ()=>{
        message.value = ''
        chatMessageInput.value.innerHTML = ''
    }

</script>



<template>

    <div class="display-flex align-items-center justify-content-between padding-2 ">
        <div class="chat-message-input-container display-flex align-items-center width-100 rounded-2 padding-2">
            <textarea 
                v-model="message" 
                @keydown="inputKeyPressHandler($event)"
                placeholder="Enter your message..." 
                rows="1"  
                class="chat-message-input border-0 padding-start-2 padding-end-2 height-100 flex-grow-1 background-transparent  font-size-16px rounded-2 display-flex align-items-center"
                dir="auto"
                ref="chatMessageInput"
            >
            </textarea>
            <i class="bi bi-arrow-up-circle-fill cursor-pointer font-size-25px text-primary" type="submit" @click="sendMessage()"></i>
            <!-- <div v-else>
                <input @change="uploadFile" type="file" class="display-none"  ref="fileInput" />
                <i class="bi bi-file-earmark-arrow-up-fill cursor-pointer font-size-25px text-primary" type="submit" @click="openFileBrwoser()"></i>
            </div> -->
        </div>
    </div>
    
</template>
