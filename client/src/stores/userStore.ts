import { reactive, ref } from "vue"
import useAxios from "../composeables/useAxios"
import { UserType } from '../types'

const user = ref<UserType>({
    _id: '',
    username: '',
    image: '',
    is_online: false,
})

const getUser = async () => {
    const axios = useAxios()

    if (!user.value._id) {
        const res = await axios.get('user')
        user.value =  res.data.user
    }

    return user.value
}

const setId = (value:string)=> user.value._id = value
const setUsername = (value:string)=> user.value.username = value
const setImage = (value:string)=> user.value.image = value


const userStore = {
    setId,
    setUsername,
    setImage,
    getUser,
}

export default userStore