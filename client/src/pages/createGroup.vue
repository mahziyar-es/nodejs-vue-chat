<script setup lang="ts">
    import { onMounted, ref, watch } from 'vue'
    import { Gamon } from 'gamon-vue'
    import {useRoute, useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
   

    
    const router = useRouter()
    const route = useRoute()
    const axios = useAxios()

    const chat = ref({
        _id: '',
        name: '',
        image: '',
        privacy_setting: {
            privacy_type: '', 
            join_type: '', 
            password: '', 
        },
    })
    const chatUser = ref({
        _id: '',
        is_admin: false,
        is_creator: false,
    })


    onMounted(()=>{
        if(route.params.id) chat.value._id = route.params.id as string 
        if(chat.value._id) getChatInfo()
    })


    watch(()=>chat.value.privacy_setting.privacy_type, (value)=>{
        if(value == 'public') chat.value.privacy_setting.join_type = 'public'
    })

    const getChatInfo = ()=>{
        axios.get('chat/'+chat.value._id)
        .then(res=>{
            chat.value = res.data.chat
            chatUser.value = res.data.chat_user
        })
    }
    
    const create = ()=>{
        let formData = new FormData()
        formData.append('name', chat.value.name)
        formData.append('image', chat.value.image)
        formData.append('privacy_type', chat.value.privacy_setting.privacy_type)
        formData.append('join_type', chat.value.privacy_setting.join_type)
        formData.append('password', chat.value.privacy_setting.password)
        
        axios.post('group', formData,{
            headers:{
               "Content-Type": "multipart/form-data"
            }
        })
        .then(res=>{
            // router.push('chat/'+res.data.chat_id)
            router.push('/chats')
        })
    }

    const update = ()=>{
        let formData = new FormData()
        formData.append('id', chat.value._id)
        formData.append('name', chat.value.name)
        formData.append('image', chat.value.image)
        formData.append('privacy_type', chat.value.privacy_setting.privacy_type)
        formData.append('join_type', chat.value.privacy_setting.join_type)
        formData.append('password', chat.value.privacy_setting.password)
        // formData.append('_method', 'PATCH')
        
        axios.post('group/update', formData,{
            headers:{
               "Content-Type": "multipart/form-data"
            }
        })
        .then(res=>{
            chat.value = res.data.chat
            Gamon.notify('Updated','success')
        })
    }
  
</script>


<template>
    <Row class="display-flex  justify-content-center overflow-auto" style="height:100vh">   
        <Col width="lg-6 md-6 padding-4">

            <h2 class="text-center">Create a new group chat</h2>

            <InputBasic v-model="chat.name" :title="'Name of your group'" />
            <InputFile v-model="chat.image" title="Image" preview :preview-size="{maxHeight: 150, maxWidth: 200}" />

            <div>
                <h3> Select the privacy of your chat </h3>
                <InputToggle v-model="chat.privacy_setting.privacy_type" :default-value="['public', 'Public']" :active-value="['private', 'Private']" />
                <p v-if="chat.privacy_setting.privacy_type == 'public' ">
                    Anyone can see messages of your group
                </p>
                <p v-if="chat.privacy_setting.privacy_type == 'private' ">
                    Only members can see messages of your group
                </p>
            </div>

            <div v-if="chat.privacy_setting.privacy_type == 'private' ">
                <h3> Select how users can join your chat </h3>
                <InputToggle v-model="chat.privacy_setting.join_type" :default-value="['public', 'Public']" :active-value="['password', 'Password']" />
                <p v-if="chat.privacy_setting.join_type == 'public' ">
                    Anyone can join your group
                </p>
                <div v-if="chat.privacy_setting.join_type == 'password' ">
                    <p>Only people who enter the correct password can join your group</p>
                    <InputBasic v-model="chat.privacy_setting.password" type="password" placeholder="Enter a password for your chat" password-visibility-toggler />
                </div>
            </div>

            <div class="margin-top-8 display-flex align-items-center justify-content-center">
                <Button text="Update" v-if="chat._id" @click="update()" class="background-primary" />
                <Button text="Create" v-else @click="create()" class="background-primary" />
            </div>



        </Col>
    </Row>
</template>
