<script setup lang="ts">
    import {inject, onMounted, ref, watch} from 'vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import userStore from '../stores/userStore'
    import socketStore from '../stores/socketStore'
    import { UserTypingEventData, OnlineStatusEventData } from '../types'

    const router = useRouter()
    const axios = useAxios()

    const emits = defineEmits([])
    const props = defineProps<{
        targetId: string,
        targetType: string,
        targetName: string,
        targetImage: string,
        targetIsOnline: boolean,
    }>()

    const targetIsTyping = ref(false)
    const targetIsOnline = ref(props.targetIsOnline || false)


    onMounted(()=>{
        socketStore.socket?.on('user-typing', (data: UserTypingEventData)=>{
            if(data.chat?.type == 'group' ){
                if(data.chat?._id == props.targetId ) targetIsTyping.value = true
            }
            else if(data.chat?.type == 'private'){
                if(data.typing_user_id == props.targetId ) targetIsTyping.value = true
            }
            
            setTimeout(()=>{
                targetIsTyping.value = false
            },500)
        })

        socketStore.socket?.on('online-status-changed', (data: OnlineStatusEventData)=>{
            if (props.targetType == 'user' && data.user_id == props.targetId) {
                targetIsOnline.value = data.is_online
            }
        })
    })


    const openChatTargetProfile = ()=>{
        if(props.targetType == 'user') router.push(`/user-profile/${props.targetId}`)
        else router.push(`/group-profile/${props.targetId}`)
    }
    
</script>


<template>
    <div class="display-flex align-items-center cursor-pointer" @click="openChatTargetProfile()">
        <div class="position-relative">
            <img :src="targetImage || '' " style="width:40px; height:40px" class="rounded-circle"  />
            <span v-if="targetIsOnline" class="online-user-indicator"></span>
        </div>
        <div class="display-flex flex-column align-items-start margin-start-2">
            <span class="font-size-17px" style="transition:0.5s">{{ targetName || '' }}</span>
            <span v-if="targetIsTyping" class="text-white">typing...</span>
        </div>
    </div>
</template>
