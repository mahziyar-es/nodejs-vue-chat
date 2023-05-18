<script setup lang="ts">
    import { Gamon } from 'gamon-vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import socketStore from '../stores/socketStore'

    const router = useRouter()
    const axios = useAxios()


    const logout = ()=>{
        Gamon.confirm('Logout', 'Are you sure ?', ()=>{
            axios.post('logout')
            .then(res=>{
                socketStore.disconnect()
                window.location.replace('/register')
            })
        })
    }
  

</script>


<template>
    <i class="bi bi-three-dots-vertical cursor-pointer font-size-20px text-primary" gamon-sheet-toggle="options-sheet"></i>

        <Sheet id="options-sheet">

            <router-link to="/user-profile" class="border-bottom-1px border-gray-light padding-2 display-flex align-items-center cursor-pointer">
                <i class="bi bi-person font-size-20px"></i>
                <span class="margin-start-2">Profile</span>
            </router-link>
            <router-link to="/create-group" class="border-bottom-1px border-gray-light padding-2 display-flex align-items-center cursor-pointer">
                <i class="bi bi-chat font-size-20px"></i>
                <span class="margin-start-2">Create new group</span>
            </router-link>
            <div class="border-bottom-1px border-gray-light padding-2 display-flex align-items-center cursor-pointer" @click="logout()">
                <i class="bi bi-power font-size-20px"></i>
                <span  class="margin-start-2">Logout</span>
            </div>


        </Sheet>
</template>
