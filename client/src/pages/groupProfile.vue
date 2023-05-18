<script setup lang="ts">
    import { onMounted, ref } from 'vue'
    import {useRoute, useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import { UserType, ChatType, MessageType, NewMessageEventData } from '../types'
    
    const router = useRouter()
    const route = useRoute()
    const axios = useAxios()

    const group = ref({
        _id: '',
        name: '',
        image: '',
    })
    const members = ref()
    const chatUser = ref()

    onMounted(()=>{
        group.value._id = route.params.id as string
        if(group.value._id) fetchGroup()
    })


    const fetchGroup = ()=>{
        axios.get('group/'+group.value._id, {
            params:{
                with_members: 1,
            }
        })
        .then(res=>{
            group.value = res.data.chat
            members.value = res.data.members
            chatUser.value = res.data.chat_user
        })
    }


    const goToChat = ()=>{
        router.push('/chat/'+group.value._id)
    }

    const goToEdit = ()=>{
        router.push('/create-group/'+group.value._id)
    }

</script>


<template>
    <div class="padding-4 overflow-hidden display-flex align-items-center" style="height:100vh">
        <Row class="display-flex align-items-center justify-content-center">
            <Col width="lg-5 md-8 display-flex flex-column align-items-center">

                <Row class="display-flex align-items-center justify-content-evenly width-100">
                    <Col width="lg-5 md-5" class="display-flex flex-column align-items-center justify-content-center">
                        <img :src="group?.image" style="width:200px; height:200px; box-shadow:0px 0px 10px gray" class="rounded-circle"  />
                        <h2>{{group?.name}}</h2>
                        <div class="display-flex align-items-center justify-content-center width-100">
                            <Button text="Start messaging" class="background-primary rounded-10 margin-1" @click="goToChat()" />
                            <Button v-if="chatUser?.is_creator" text="Edit" class="background-secondary rounded-10 margin-1" @click="goToEdit()" />
                        </div>
                    </Col>
                    <Col width="lg-2 md-2" class="display-flex justify-content-center md-display-flex sm-display-none xs-display-none">
                        <div style="width:1px; height:300px" class="background-primary"></div>
                    </Col>
                    <Col width="lg-5 md-5">
                        <h3>Members</h3>
                        <div style="height:300px" class="overflow-auto">
                            <div v-for="member in members" :key="member._id" class="display-flex align-items-center margin-bottom-3">
                                <img style="width:50px; height:50px" class="rounded-circle" :src="member?.user?.image">
                                <div class="margin-start-2 display-flex flex-column">
                                    <span>{{member?.user?.username}}</span>
                                    <span v-if="member?.is_admin" class="margin-top-1 font-size-12px background-secondary rounded-5 text-center">admin</span>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            
            </Col>
        </Row>
    </div>
</template>
