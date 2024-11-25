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

const nama_jabatan = ref("");
const status = ref("");
const errors = ref([]);


//onMounted
onMounted( async () => {

    //fetch detail data jabatan by ID
    await api.get(`/api/jabatan/${route.params.id}`)
    .then(response => {
        
        //set response data to state
        nama_jabatan.value = response.data.data.nama_jabatan
        status.value = response.data.data.status
    });
})

//method "updateJabatan"
const updateJabatan = async () => {

    //init formData
    let formData = new FormData();

    //assign state value to formData
  
    formData.append("nama_jabatan", nama_jabatan.value);
    formData.append("status", status.value);
    formData.append("_method", "PATCH");

    //store data with API
    await api.post(`/api/jabatan/${route.params.id}`, formData)
    .then(() => {
        //redirect
        router.push({ path: "/jabatan" });
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
      <p class="text-uppercase text-sm fw-bold fw-bold">Ubah Data Jabatan</p>
      <form @submit.prevent="updateJabatan()">
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nama Jabatan</label>
                                <input type="text" class="form-control" v-model="nama_jabatan" placeholder="Nama Jabatan">
                                <div v-if="errors.nama_jabatan" class="alert alert-danger mt-2">
                                    <span>{{ errors.nama_jabatan[0] }}</span>
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
                            <router-link :to="{ name: 'Data Jabatan' }" class= "btn btn-outline-secondary rounded-sm shadow border-0 mb-3 me-2">Batal</router-link>
                        </form>
                      </div>
    </div>
  </div>
</template>
