<script setup lang="ts">
    import { onMounted, ref } from "vue";
    import { useRouter } from "vue-router";
    import useAxios from "../composeables/useAxios";
    import Login from "../components/Login.vue";
    import Signup from "../components/Signup.vue";

    const axios = useAxios()
    const router = useRouter()

    const user = ref() 
    const tab = ref('') 


    const start = ()=>{
        axios.get('start')
        .then(res=>{
            user.value = res.data.user || undefined

        })
    }

    onMounted(()=>{
        start()
    })

</script>


<template>
    <div class="landing display-flex flex-column align-items-center  padding-4 height-screen">


        <div class="landing__name text-primary display-flex align-items-center">
            <div class="background-primary display-flex  align-items-center justify-content-center rounded-circle" style="width:70px; height:70px">G</div>
            <div>chat</div>
        </div>

        <div class="flex-fill width-100 display-flex  align-items-center ">
            <div v-if="!tab" class="landing__motto  text-primary flex-column display-flex flex-wrap justify-content-center margin-auto">
                <div class="display-flex align-items-center justify-content-center flex-wrap">
                    <div class="landing__motto__animated landing__motto__animated--type1 text-secondary "> Simple </div>
                    <div class="landing__motto__animated landing__motto__animated--type3 margin-start-2 margin-end-2"> and </div>
                    <div class="landing__motto__animated landing__motto__animated--type2 text-secondary ">  Secure </div>
                </div>
                <div class="landing__motto__animated landing__motto__animated--type3 margin-top-4 text-center">
                    A messaging platform for everyone
                </div>
            </div>


            <Row v-if="tab" class="width-100 overflow-hidden display-flex align-items-center justify-content-center  padding-3">
                <Col width="lg-5 md-6 display-flex  position-relative">
                    <div class="width-100 display-flex register-form-container flex-column align-items-center justify-content-center">
                        <div  :class="['width-100', tab == 'login' ? 'toggle-animation--show' : 'toggle-animation--hide' ]">
                            <Login  />
                        </div>
                        <div :class="['width-100', tab == 'signup' ? 'toggle-animation--show' : 'toggle-animation--hide' ]">
                            <Signup  />
                        </div>
                    </div>

                </Col>
            </Row>
        </div>
        
        <div v-if="user" class="text-center">
            <p class="text-primary font-size-25px"> Welcome back {{ user.username }} </p>
            <Button @click="router.push('/chats')"  text="Start messaging" class="background-secondary text-white rounded-10" />
        </div>
        <TabBar v-else v-model="tab" :tabs="[ ['login', 'Login'], ['signup', 'Signup'] ]" :width="200" class="background-primary" />
          
    </div>
</template>
