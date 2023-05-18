<script setup lang="ts">
    import { onMounted, ref } from "vue";
    import { useRouter } from "vue-router";
    import useAxios from "../composeables/useAxios";

    const axios = useAxios()
    const router = useRouter()


    const start = ()=>{
        axios.get('start')
        .then(res=>{
            router.replace('/chats')
        })
    }

    onMounted(()=>{
        start()
    })

</script>


<template>
    <div class="general-loading display-flex flex-column align-items-center justify-content-center">
        <Loading />
        <h2 class="text-primary">Loading...</h2>
    </div>
</template>
