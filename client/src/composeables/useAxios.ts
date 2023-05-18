import axios from "axios";
import { useRouter } from "vue-router";
import { Gamon } from "gamon-vue";


const useAxios = () => {

    const router = useRouter()

    const axiosInstance = axios.create({
        baseURL: 'http://127.0.0.1:3000/api/',
        withCredentials: true,
    })


    axiosInstance.interceptors.request.use(function (config) {
        return config;
    }, function (error) {
        return Promise.reject(error);
    });
    
    
    axiosInstance.interceptors.response.use(function (response) {
        return response;
    }, function(error) {

        const errorMessage = error?.response?.data?.message || ''
        if (errorMessage) Gamon.notify(errorMessage, 'error')

        if (error.response && error.response.status && error.response.status == 401) {
            router.replace('register')
        }
        
        return Promise.reject(error);
    });



    return axiosInstance
}


export default useAxios