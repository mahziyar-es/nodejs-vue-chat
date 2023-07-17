<script setup lang="ts">
    import {computed, inject, ref} from 'vue'
    import {useRouter} from 'vue-router'
    import {Gamon} from 'gamon-vue'
    import useAxios from '../composeables/useAxios'
    import userStore from '../stores/userStore'

    const router = useRouter()
    const axios = useAxios()

    const username = ref('')
    const password = ref('')
    const loading = ref(false)


    const buttonDisabled = computed(()=>{
        return !(username.value && password.value)
    })

    const login = ()=>{

        if(username.value == '' || username.value == null || username.value == undefined ){
            Gamon.notify('Enter your username', 'error')
            return;
        }
        if(password.value == '' || password.value == null || password.value == undefined ){
            Gamon.notify('Enter your password', 'error')
            return;
        }

        loading.value = true 

        axios.post('login',{
            username: username.value,
            password: password.value,
        })
        .then(res=>{
            loading.value = false 
            userStore.setId(res.data.user_id)
            userStore.setUsername(res.data.user_username)
            userStore.setImage(res.data.user_image)
            window.location.replace('/chats')
        })
        .catch(err=>{
            loading.value = false 
        })
    }

</script>


<template>
    <form @submit.prevent="login()" class="width-100 display-flex flex-column align-items-center justify-content-center">
        <InputBasic v-model="username" placeholder="Username" class="margin-top-3" />
        <InputBasic v-model="password" placeholder="Password" type="password" class="margin-top-3" />
        <Button type="submit" text="Login" class="margin-0 margin-top-5 background-primary" :loading="loading" :disabled="buttonDisabled" />
    </form>
</template>
