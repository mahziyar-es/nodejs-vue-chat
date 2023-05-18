<script setup lang="ts">
    import { ref, watch, computed } from 'vue'
    import {useRouter} from 'vue-router'
    import useAxios from '../composeables/useAxios'
    import {Gamon} from 'gamon-vue'
    import SearchItem from './SearchItem.vue'
    import { ChatType } from '../types'

    const router = useRouter()
    const axios = useAxios()

    type SearchTypes = 'user' | 'group'
    
    const query = ref('')
    const found = ref<ChatType[]>([])
    const foundUserChats = ref([])
    const searchType = ref<SearchTypes>('user')
    const emits = defineEmits(['select'])

    watch(query, ()=>{
        if(query.value.length > 1) search()
    })

    watch(searchType, ()=>{
        search()
    })

    const searchInputPlaceholder = computed(()=>{
        if(searchType.value == 'user') return 'Search among users'
        else if(searchType.value == 'group') return 'Search among groups'
    })


    const search = ()=>{
        if(!query.value) return 

        clearSearch()
        
        axios.get('search', {
            params:{
                type: searchType.value,
                query: query.value,
            }
        })
        .then(res=>{
            if(searchType.value == 'user') found.value = res.data.result
            else{
                found.value = res.data.result.chats
                foundUserChats.value = res.data.result.user_chats
            }
        })
    }

    const clearSearch = ()=>{
        found.value = []
        foundUserChats.value = []
    }

    const userchTypeSelection = (type:SearchTypes)=> searchType.value = type

    const itemSelection = (item:any)=>{

        let chat 
        let target_user 

        if(searchType.value == 'user'){
            chat = {
                _id: item.chat_id,
                type: 'private',
            }

            target_user = item
        } 
        else {
            chat = item
            target_user = undefined
        }

        emits('select', chat, target_user)
        Gamon.sheetToggle('search-sheet')
    }
    
</script>


<template>
    <i class="bi bi-search cursor-pointer font-size-20px text-primary" gamon-sheet-toggle="search-sheet"></i>

    <Teleport to="body">
        <Sheet id="search-sheet" :on-dismiss="clearSearch">
            <div class="">
            
                <Row class="justify-content-center">
                    <Col width="lg-12">
                        <InputBasic v-model="query" :delay="500" :placeholder="searchInputPlaceholder" />
                        <div class="margin-top-5 display-flex align-items-center">
                            <div @click="userchTypeSelection('user')" :class="['cursor-pointer padding-3 rounded-5 margin-1 border-1px border-primary', searchType == 'user' ? 'background-primary' : '' ]">Users</div>
                            <div @click="userchTypeSelection('group')" :class="['cursor-pointer padding-3 rounded-5 margin-1 border-1px border-primary', searchType == 'group' ? 'background-primary' : '' ]">Groups</div>
                        </div>
                    </Col>
                </Row>


                <div class="margin-top-5">
                    <div v-if="foundUserChats.length > 0">
                        <p>Your chats</p>
                        <SearchItem :type="searchType" v-for="(item, index) in foundUserChats" :key="index" :item="item" @click="itemSelection(item)" />
                    </div>
                    <div v-if="found.length > 0">
                        <br>
                        <p>Search results</p>
                        <SearchItem :type="searchType" v-for="(item, index) in found" :key="index" :item="item" @click="itemSelection(item)" />
                    </div>
                </div>
                
            

            </div>
        </Sheet>
    </Teleport>
</template>
