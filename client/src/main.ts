import { createApp } from "vue";
import gamonVue from 'gamon-vue'
import {createRouter, createWebHistory} from 'vue-router'
import './assets/css/general.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import App from './App.vue'
import StartPage from './pages/start.vue'
import RegisterPage from './pages/register.vue'
import ChatsPage from './pages/chats.vue'
import ChatPage from './pages/chat.vue'
import UserProfilePage from './pages/userProfile.vue'
import GroupProfilePage from './pages/groupProfile.vue'
import createGroupPage from './pages/createGroup.vue'


const routes = [
    { path: '/', component: StartPage },
    { path: '/register', component: RegisterPage },
    { path: '/chats', component: ChatsPage },
    { path: '/chat/:id?', component: ChatPage },
    { path: '/create-group/:id?', component: createGroupPage },
    { path: '/user-profile/:id?', component: UserProfilePage },
    { path: '/group-profile/:id', component: GroupProfilePage },
]
  
const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.use(gamonVue, {
    notify: {
        position:'bottom'
    }
})
app.mount('#app')
