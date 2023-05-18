<script setup lang="ts">
    import { onMounted, ref } from "vue";
    import { useRouter } from "vue-router";
    import useAxios from "./composeables/useAxios";
    import { isSmallScreen } from "./utils";

    const axios = useAxios()
    const router = useRouter()

    onMounted(()=>{
    })

</script>


<template>
    <div :class="['', isSmallScreen() ? 'layout-small-screen' : 'layout-large-screen' ]">
        <router-view v-slot="{ Component }">
            <Transition >
                <Component :is="Component" ></Component>
            </Transition>
        </router-view>
    </div>
</template>
