<script setup lang="ts">
    import {inject, ref, watch} from 'vue'
    import {useRouter} from 'vue-router'
    import {Gamon} from 'gamon-vue'
    import useAxios from '../composeables/useAxios'
    import userStore from '../stores/userStore'
    import socketStore from '../stores/socketStore'
    import { UserType, ChatType, MessageType, NewMessageEventData, MessageDeletedEventData, UserTypingEventData } from '../types'

    const router = useRouter()
    const axios = useAxios()

    const emits = defineEmits(['joined'])
    const props = defineProps<{
        chat: ChatType,
        onJoined: ()=>void,
    }>()

    const password = ref('')


    const joinChat = ()=>{
        if(!props.chat || !props.chat._id) return 

        if(props.chat?.privacy_setting?.join_type == 'password' && !password.value) {
            Gamon.notify('Enter password', 'error')
            return
        }

        socketStore.socket.emit('join-group', password.value, (err = null)=>{
            if(err){
                Gamon.notify(err, 'error')
                return
            }
            props.onJoined?.()
        })
    }

</script>


<template>
    <div class="display-flex align-items-center justify-content-center padding-2">
        <div 
            v-if="chat.privacy_setting?.join_type == 'public' " 
            @click="joinChat()" 
            class="background-secondary rounded-2 height-100 padding-2 display-flex align-items-center justify-content-center cursor-pointer" style="width:100px"
        >
            Join
        </div>
        <Row v-if="chat.privacy_setting?.join_type == 'password' " class="width-100 display-flex align-items-center justify-content-center">
            <Col width="lg-6 md-8" class="border-1px rounded-2 background-primary display-flex align-items-center padding-start-2 padding-end-2" style="height:40px;">
                <input v-model="password" type="password" placeholder="Enter password" class="background-primary border-0 width-100 height-100" />
                <Button text="join" @click="joinChat()" class="background-secondary rounded-2" size="small" />
            </Col>
        </Row>
    </div>
</template>
