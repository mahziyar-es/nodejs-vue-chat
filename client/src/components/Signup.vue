<script setup lang="ts">
    import {inject, ref, watch} from 'vue'
    import {useRouter} from 'vue-router'
    import {Gamon} from 'gamon-vue'
    import useAxios from '../composeables/useAxios'
    import userStore from '../stores/userStore'

    const router = useRouter()
    const axios = useAxios()

    const username = ref('')
    const password = ref('')
    const passwordRetype = ref('')  
    const passwordValidation = ref({
        containsNumber : false,
        containsLowerCase : false,
        containsUpperCase : false,
        containsSpecialChar : false,
        propperlength : false,
    })
    const signupButtonDisabled = ref(true)


    const signup = ()=>{

        if(username.value == '' || username.value == null || username.value == undefined ){
            Gamon?.notify('Enter your username', 'error')
            return;
        }
        if(password.value == '' || password.value == null || password.value == undefined ){
            Gamon?.notify('Enter your password', 'error')
            return;
        }
        

        if(password.value !==  passwordRetype.value ){
            Gamon?.notify('Passwords do not match', 'error')
            return;
        }


        axios.post('signup',{
            username: username.value,
            password: password.value,
        })
        .then(res=>{
            userStore.setId(res.data.user_id)
            userStore.setUsername(res.data.user_username)
            userStore.setImage(res.data.user_image)
            window.location.replace('/chats')

        })
        
    }

    watch(password, ()=>{
        const number = /^(.*[0-9].*)$/
        const lowerCase = /^(.*[a-z].*)$/
        const upperCase = /^(.*[A-Z].*)$/
        const specialChar = /^(.*\W.*)$/
        const length = /^.{8,}$/

        passwordValidation.value.containsNumber = number.test(password.value)
        passwordValidation.value.containsLowerCase = lowerCase.test(password.value)
        passwordValidation.value.containsUpperCase = upperCase.test(password.value)
        passwordValidation.value.containsSpecialChar = specialChar.test(password.value)
        passwordValidation.value.propperlength = length.test(password.value)
    })

    watch(passwordValidation.value, ()=>{
        signupButtonDisabled.value =!
            (passwordValidation.value.containsNumber && passwordValidation.value.containsLowerCase &&
            passwordValidation.value.containsUpperCase && passwordValidation.value.containsSpecialChar &&
            passwordValidation.value.propperlength)
    })

</script>


<template>
    <form @submit.prevent="signup()" class="width-100 display-flex flex-column align-items-center justify-content-center">
        <InputBasic v-model="username" placeholder="Username" class="margin-top-3" />
        <InputBasic v-model="password" placeholder="Password" type="password" class="margin-top-3" passwordVisibilityToggler />
        <InputBasic v-model="passwordRetype" placeholder="Confirm password" type="password" class="margin-top-3" passwordVisibilityToggler />

        <div class="display-flex align-items-start flex-column width-100 margin-top-3 font-size-14px ">
            <span :class="passwordValidation.containsNumber? 'text-green' : 'text-red' ">- Password must contain at least one number</span>
            <span :class="passwordValidation.containsLowerCase? 'text-green' : 'text-red' ">- Password must contain lower case character</span>
            <span :class="passwordValidation.containsUpperCase? 'text-green' : 'text-red' ">- Password must contain upper case character</span>
            <span :class="passwordValidation.containsSpecialChar? 'text-green' : 'text-red' ">- Password must contain at least one special character</span>
            <span :class="passwordValidation.propperlength? 'text-green' : 'text-red' ">- Password must be at least 8 characters</span>
        </div>

        <Button text="Signup" class="margin-0 margin-top-5 background-primary" :disabled="signupButtonDisabled" type="submit" />
    </form>
</template>
