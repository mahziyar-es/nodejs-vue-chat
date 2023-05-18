import { reactive, ref } from 'vue'
import useAxios from '../composeables/useAxios'

const chats = ref([])



const chatsList = async (forceFetch = false) => {
    const axios = useAxios()

    if (chats.value.length == 0 || forceFetch) {
        const res = await axios.get('chats')
        chats.value = res.data.chats
    }

    return chats.value
}

const userChatsStore = reactive({
    chatsList,
    chats,
})


export default userChatsStore
