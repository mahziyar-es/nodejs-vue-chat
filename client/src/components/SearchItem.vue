<script setup lang="ts">
    import { onMounted } from 'vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import { UserType } from '../types'

    const router = useRouter()
    const axios = useAxios()

    
    const props = defineProps<{
        type: 'user' | 'group', 
        item: {
            name?: string,   
            username?: string,   
            image: string,   
        },
    }>()    


    onMounted(()=>{

    })
  
</script>


<template>

    <div class="border-bottom-1px padding-bottom-2 margin-bottom-2 display-flex align-items-center cursor-pointer">
        <img :src="props.item.image" style="width:50px; height:50px" class="rounded-circle" />
        <p class="margin-start-3">{{ props.type == 'user' ? item.username : item.name }}</p>
    </div>
      
</template>
