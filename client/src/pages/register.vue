<script setup lang="ts">
    import {ref, watch} from 'vue'
    import Login from '../components/Login.vue'
    import Signup from '../components/Signup.vue'


    const tab = ref('login') 
    const changingFormAnimation = ref(false) 

    watch(tab, ()=>{
        changingFormAnimation.value = true 
        setTimeout(()=>{
            changingFormAnimation.value = false 
        },500)
    })


</script>


<template>
    <Row style="height:100vh" class="width-100 overflow-hidden display-flex align-items-center justify-content-center padding-3">
        <Col width="lg-4 md-6 sm-12 display-flex flex-column align-items-center justify-content-center position-relative">

            <TabBar v-model="tab" :tabs="[ ['login', 'Login'], ['signup', 'Signup'] ]" :width="200" class="background-primary" />

            <div class="width-100 register-form-container">
                <div  :class="['width-100', tab == 'login' ? 'toggle-animation--show' : 'toggle-animation--hide' ]">
                    <Login  />
                </div>
                <div :class="['width-100', tab == 'signup' ? 'toggle-animation--show' : 'toggle-animation--hide' ]">
                    <Signup  />
                </div>
            </div>


        </Col>
    </Row>
</template>
