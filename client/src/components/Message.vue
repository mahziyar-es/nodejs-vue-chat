<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue'
    import { Gamon } from 'gamon-vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import userChatsStore from '../stores/userChatsStore'
    import ChatItem from './ChatItem.vue'
    import { UserType, ChatType, MessageType, NewMessageEventData, MessageDeletedEventData } from '../types'

    const router = useRouter()
    const axios = useAxios()

    const emits = defineEmits(['deleteMessage', 'messageSelected', 'messageClicked'])

    const props = defineProps<{
        socket: any,
        message:MessageType,
        viewerUser:UserType,
        selected: boolean,
    }>()

    const optionsSheetDisplay = ref(false)
    const forwardSheetDisplay = ref(false)
    const userChatsList = ref()
    const displayableImageExtensions = ref(['png', 'jpg', 'jpeg', 'gif'])
    const fileMessageExtension = ref('')

    const textMessageParts = computed(()=>{
        return props.message.message.split(/\r?\n/g)
    })

    onMounted(()=>{
        if(props.message.type == 'file'){
            fileMessageExtension.value = props.message.message.split('.').reverse()[0]
        }
    })

    const messageSelected = () =>  emits('messageSelected')
    const messageClicked = () => emits('messageClicked')

    const showOptionsSheet = ()=> optionsSheetDisplay.value = true
    const hideOptionsSheet = ()=> optionsSheetDisplay.value = false

    const showForwardSheet = ()=> forwardSheetDisplay.value = true
    const hideForwardSheet = ()=> forwardSheetDisplay.value = false

    const copy = ()=>{
        var textarea = document.createElement("textarea");
        textarea.textContent = props.message.message;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy"); // TODO
        document.body.removeChild(textarea);

        Gamon.notify('Copied to clipboard', 'success')
    }

    const deleteMessage = ()=>{
        props.socket.emit('delete-message', [props.message._id])
    }
    
    const openForwardSheet = async()=>{
        userChatsList.value = await userChatsStore.chatsList()
        hideOptionsSheet()
        showForwardSheet()
    }

    const forwardMessage = (chatId: string)=>{
        axios.post('message/forward',{
            chat_id : chatId,
            message_id : props.message._id,
        })
        .then(res=>{
            Gamon.notify('Message forwarded', 'success')
            hideForwardSheet()
        })
    }

</script>



<template>
    <div class="margin-bottom-3">

        <!-- notification -->
        <div v-if="props.message.type == 'notification' " class="width-100 display-flex align-items-center justify-content-center ">
            <div style="min-width:200px;" class="rounded-2 text-secondary padding-1 font-size-14px text-center chat-message-notification-type">{{props.message.message}}</div>
        </div>
        <!-- / -->

        <!-- normal message -->
        <div v-else>
            <div 
                :class="['display-flex align-items-center rounded-2 message-box', 
                    message.sender_id == viewerUser?._id ? 'message-box--sender flex-row-reverse' : 'message-box--rec' ,
                ]"
                v-custom-click="{
                    click_callback: ()=>messageClicked(),
                    long_click_callback: ()=>messageSelected(),
                    long_click_duration: '1000',
                }"
            >   

                <router-link :to="'/user-profile/'+message.user?._id">
                    <img :src="message.user?.image" style="width:30px; height:30px" class="rounded-circle" />
                </router-link>

                <div :class="['padding-2 height-fit-content rounded-2 display-flex flex-column max-width-60 message-box__content', 
                    message.sender_id == viewerUser?._id ? 'message-sender margin-end-2' : 'message-rec margin-start-2',
                    props.selected ? 'selected': ''
                    ]"
                >
                    <div class="font-size-13px message-username display-flex align-items-center justify-content-between">
                        <b class="display-flex flex-column">
                            <span>{{ message.user?.username }}</span>
                            <router-link :to="'/user-profile/'+message.forwarded_from_user?._id" v-if="message.forwarded_from_user" class="margin-top-1 font-size-14px text-secondary"> forwarded from {{message.forwarded_from_user?.username}}</router-link>
                        </b>
                        <i @click="showOptionsSheet" class="bi bi-three-dots-vertical cursor-pointer margin-start-2"></i>
                    </div>
                    <div :class="['margin-top-3' ]">
                        <div  v-if="message.type == 'text' "  style="word-wrap:break-word" >
                            <div v-for="(textMesagePart, index) in textMessageParts" :key="index" class="min-width-fit-content" style="min-width:-moz-fit-content">{{ textMesagePart }}</div>
                        </div>
                        <a v-else :href="message.message" target="_blank">
                            <img v-if="displayableImageExtensions.indexOf(fileMessageExtension) != -1 " style="max-height:100px"  :src="message.message" class="rounded-1 max-width-100">
                            <div v-else> {{message.message}} </div>
                        </a>
                    </div>
                </div>


                <Sheet :display="optionsSheetDisplay" :on-dismiss=" hideOptionsSheet " :width="200" height="fit-content">
                    <div class="text-primary">
                        <div v-if="message.type == 'text' " class="cursor-pointer padding-2 border-bottom-1px border-gray-light margin-top-2" @click="copy()"> Copy </div>
                        <!-- <div class="cursor-pointer padding-2 border-bottom-1px border-gray-light margin-top-2" @click="openForwardSheet()"> Forward </div> -->
                        <div v-if="message.type == 'file' " class="cursor-pointer padding-2 border-bottom-1px border-gray-light margin-top-2">
                            <a class="text-primary" :href="message.message" download>Download</a> 
                        </div>
                        <div class="cursor-pointer padding-2 border-bottom-1px border-gray-light margin-top-2" @click="deleteMessage()"> Delete </div>
                    </div>
                </Sheet>


                
            </div>

            <Sheet title="Forward to..." :display="forwardSheetDisplay" :on-dismiss=" hideForwardSheet " height="fit-content" class="text-primary">
                <ChatItem v-for="chat in userChatsList" :key="chat._id" :chat="chat" @click="forwardMessage(chat._id)"  />
            </Sheet>
        </div>
        <!-- / -->


    </div>
</template>
