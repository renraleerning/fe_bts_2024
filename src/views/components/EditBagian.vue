<script setup>

 //import ref
 import { ref, onMounted } from "vue";

//import router
import { useRouter, useRoute } from 'vue-router';

//import api
import api from "../../api";

//init router
const router = useRouter();

//init route
const route = useRoute();

//define state

const nama_bagian = ref("");
const status = ref("");
const errors = ref([]);


//onMounted
onMounted( async () => {

    //fetch detail data post by ID
    await api.get(`/api/bagian/${route.params.id}`)
    .then(response => {
        
        //set response data to state
        nama_bagian.value = response.data.data.nama_bagian
        status.value = response.data.data.status
    });
})

//method "updatePost"
const updatePost = async () => {

    //init formData
    let formData = new FormData();

    //assign state value to formData
  
    formData.append("nama_bagian", nama_bagian.value);
    formData.append("status", status.value);
    formData.append("_method", "PATCH");

    //store data with API
    await api.post(`/api/bagian/${route.params.id}`, formData)
    .then(() => {
        //redirect
        router.push({ path: "/bagian" });
    })
    .catch((error) => {
        //assign response error data to state "errors"
        errors.value = error.response.data;
    });
};
</script>
<template>
  
  <div class="card card-profile">
    <div class="container mt-4">
    <div class="card-body">
      <p class="text-uppercase text-sm fw-bold">Ubah Data Bagian</p>
      <form @submit.prevent="updatePost()">
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nama Bagian</label>
                                <input type="text" class="form-control" v-model="nama_bagian" placeholder="Nama Bagian/Department">
                                <div v-if="errors.nama_bagian" class="alert alert-danger mt-2">
                                    <span>{{ errors.nama_bagian[0] }}</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Status</label>
                                <div></div>
                                <select class="form-select" v-model="status">
                                <option>Aktif</option>
                                <option>Non Aktif</option>
                                </select>
                                <div v-if="errors.status" class="alert alert-danger mt-2">
                                    <span>{{ errors.status[0] }}</span>
                                </div>
                            </div>
                           

                                
                            <button type="submit" class="btn btn-md btn-primary rounded-sm shadow border-0 me-2">Update</button>
                            <router-link :to="{ name: 'Data Bagian' }" class= "btn btn-outline-secondary rounded-sm shadow border-0 mb-3 me-2">Batal</router-link>
                        </form>
                      </div>
    </div>
  </div>
</template>
