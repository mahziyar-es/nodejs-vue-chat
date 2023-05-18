<script setup lang="ts">
    import { Gamon } from 'gamon-vue';
    import {onMounted, ref, watch} from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import useAxios from '../composeables/useAxios';
    import userStore from '../stores/userStore';

    const router = useRouter()
    const route = useRoute()
    const axios = useAxios()

    const user = ref({
        _id: '',
        image: '',
        username: '',
        password: '',
    })
    const newData = ref({
        image: '',
        username: '',
        old_password: '',
        new_password: '',
    })
    const blocked = ref(0)
    const selectedForm = ref('general')
    const viewerUser = ref()


    onMounted(async ()=>{
        getUserInfo()
        viewerUser.value = await userStore.getUser()
    })


    const getUserInfo = ()=>{
        user.value._id = route.params.id as string
        axios.get('user/'+user.value._id)
        .then(res=>{
            user.value = res.data.user
            blocked.value = res.data.blocked
        })
    }

    const changeGeneralData = ()=>{
        if (!newData.value.username && !newData.value.image) {
            Gamon.notify('You did not enter any data', 'error')
            return
        }

        let formData = new FormData()
        formData.append('username', newData.value.username)
        formData.append('image', newData.value.image)

        axios.post('user',formData,{
            headers:{
               "Content-Type": "multipart/form-data"
            }
        })
        .then(res=>{
            user.value = res.data.user
            Gamon.notify('Done', 'success')
            newData.value.username = ''
            newData.value.image = ''
        })
    }

    const changePassword = ()=>{

        if (!newData.value.old_password || !newData.value.new_password) {
            Gamon.notify('Please fill all the fields', 'error')
            return
        }
        
        let formData = new FormData()
        formData.append('old_password', newData.value.old_password)
        formData.append('new_password', newData.value.new_password)

        axios.patch('user/password', formData)
        .then(res=>{
            Gamon.notify('Password changed', 'success')
            newData.value.new_password = ''
            newData.value.old_password = ''
        })
    }

    const block = ()=>{
        axios.post('user/block',{
            target_user_id: user.value._id
        })
        .then(res=>{
            blocked.value = 1
            Gamon.notify('Blocked','success')
        })
    }

    const unblock = ()=>{
        axios.post('user/unblock',{
            target_user_id: user.value._id
        })
        .then(res=>{
            blocked.value = 0
            Gamon.notify('Unblocked', 'success')
        })
    }


    const startMessaging = ()=>{
        router.push({path:'/chat', query: {target_user_id: user.value._id } })
    }

</script>


<template>
    <div class="padding-4 overflow-hidden display-flex align-items-center" style="height:100vh">
        
        <Row class="display-flex align-items-center justify-content-center">
            <Col width="lg-6 md-8 display-flex flex-column align-items-center">

                <Row class="display-flex align-items-center justify-content-evenly width-100">


                    <Col width="lg-5 md-3" class="display-flex flex-column align-items-center justify-content-center">
                        <img :src="user.image" style="width:200px; height:200px; box-shadow:0px 0px 10px gray" class="rounded-circle"  />
                        <h2>{{user.username}}</h2>
                    </Col>


                    <Col width="lg-2 md-1" class="justify-content-center md-display-none display-flex">
                        <div style="width:1px; height:300px" class="background-primary"></div>
                    </Col>


                    <Col width="lg-5 md-7">
                        <div v-if="viewerUser?._id == user._id ">
                            <TabBar v-model="selectedForm" :tabs="[  ['general', 'General'], ['password', 'Password']   ]" width="200px" class="background-primary" />
                            <form v-if="selectedForm == 'general' " @submit.prevent="changeGeneralData()" class="margin-top-5">
                                <InputFile v-model="newData.image" placeholder="New profile image" preview class="margin-bottom-3" />
                                <InputBasic v-model="newData.username" placeholder="New username" class="margin-bottom-3" />
                                <div class="margin-bottom-3 display-flex justify-content-center">
                                    <Button text="Save" width="100%" class="background-primary" type="submit" />
                                </div>
                            </form>
                            <form v-if="selectedForm == 'password' " @submit.prevent="changePassword()" class="margin-top-5">
                                <InputBasic v-model="newData.old_password" type="password" placeholder="Current passowrd" password-visibility-toggler class="margin-bottom-3" />
                                <InputBasic v-model="newData.new_password" type="password" placeholder="New passowrd" password-visibility-toggler class="margin-bottom-3" />
                                <div class="margin-bottom-3 display-flex justify-content-center">
                                    <Button text="Save" width="100%" class="background-primary" type="submit" />
                                </div>
                            </form>
                        </div>
                        <div v-else class="display-flex flex-column align-items-center justify-content-center">
                            <Button text="Start messaging" class="background-primary rounded-10" @click="startMessaging()" />
                            <Button v-if="blocked" text="Unblock" class="background-secondary rounded-10 margin-2" @click="unblock()" />
                            <Button v-if="!blocked" text="Block" class="background-secondary rounded-10 margin-2" @click="block()" />
                        </div>
                    </Col>


                </Row>
           
            </Col>
        </Row>

    </div>
</template>
