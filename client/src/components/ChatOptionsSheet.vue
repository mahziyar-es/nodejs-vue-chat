<script setup lang="ts">
    import {inject, ref, watch} from 'vue'
    import {useRouter} from 'vue-router'
    import {Gamon} from 'gamon-vue'
    import useAxios from '../composeables/useAxios'
    import socketStore from '../stores/socketStore'
    import { isSmallScreen } from '../utils'


    const router = useRouter()
    const axios = useAxios()


    const emits = defineEmits(['leave-chat'])
    const props = defineProps<{
        chatId?: string,
        chatType?: string,
        targetId?: string,
    }>()


    const leaveGroup = ()=>{
        if(!props.chatId) return

        socketStore.socket.emit('leave-group', (err = null)=>{
            if(err){
                Gamon.notify(err, 'error')
                return
            }
            if(isSmallScreen()){
                router.replace('/chats')
            }
        })
    }


    const clearHistory = ()=>{
        Gamon.confirm('Clear history', 'Are you sure?', ()=>{
            socketStore.socket.emit('clear-history', (err =  null) => {
                if (err) {
                    Gamon.notify(err, 'error')
                    return 
                }
                Gamon.notify('History cleared', 'success')
            })
        })
    }

</script>


<template>
    <i class="bi bi-three-dots-vertical cursor-pointer font-size-20px text-white" gamon-sheet-toggle="chat-more-options-sheet"></i>

    <Teleport to="#app">
        <Sheet id="chat-more-options-sheet">
            <div v-if="props.chatType ==  'group' " @click="leaveGroup()" class="padding-2 border-bottom-1px border-gray-light cursor-pointer margin-top-2">Leave</div>
            <div @click="clearHistory()" class="padding-2 border-bottom-1px border-gray-light cursor-pointer margin-top-2">Clear my history</div>
        </Sheet>
    </Teleport>

</template>
