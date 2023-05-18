<script setup lang="ts">
    import {inject, onMounted, ref} from 'vue'
    import {useRoute, useRouter} from 'vue-router'
    import {Gamon} from 'gamon-vue'
    import useAxios from '../composeables/useAxios'
    import Chat from '../components/Chat.vue'
    import { UserType, ChatType, MessageType, NewMessageEventData } from '../types'


    const router = useRouter()
    const route = useRoute()
    const axios = useAxios()

    const dataFetched = ref(false)
    const chat = ref<ChatType>()
    const targetUser = ref<UserType>()

    onMounted(()=>{
        const chatId = route.params.id
        const targetUserId = route.query.target_user_id

        if(!chatId && !targetUserId) return

        axios.get('chat',{
            params:{
                chat_id: chatId,
                target_user_id: targetUserId,
            },
        })
        .then(res=>{
            dataFetched.value= true
            chat.value = res.data.chat
            targetUser.value = res.data.target_user || null
        })
    })

</script>


<template>
    <div style="height:100vh" class="overflow-hidden">
        <Chat 
            v-if="dataFetched"
            :chat="chat!"
            :user="targetUser"
        />
    </div>
</template>
