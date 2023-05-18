import { reactive, ref } from 'vue'
import { io } from "socket.io-client";


const socket = ref()
const connected = ref(false)


const connect = async () => {
    socket.value = io('http://127.0.0.1:3000/chat',{
        transports: ["websocket"],
        // query:{
        //     chat_ids:  chatIds.join(",")
        // }
    })
}

const disconnect = async () => {
    socket.value.disconnect()
}

connect()

socket.value?.on('connect', ()=>{
    console.log('connected to socket')
    connected.value = true
})

socket.value?.on('disconnect', ()=>{
    console.log('disconnected')
    connected.value = false
})

socket.value?.on('connect_error', (err:any)=>{
    console.log('connection error: '+err)
    connected.value = false
})

const socketStore = reactive({
    connect,
    disconnect,
    socket,
    connected,
})


export default socketStore
