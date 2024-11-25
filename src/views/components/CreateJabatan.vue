<script setup>

//import ref
import { ref } from "vue";

//import router
import { useRouter } from 'vue-router';

//import api
import api from "../../api";

//init router
const router = useRouter();

//define state
const nama_jabatan = ref("");
const status = ref("Aktif");
const errors = ref([]);


//method "storePost"
const storeJabatan = async () => {

    //init formData
    let formData = new FormData();

    //assign state value to formData
    formData.append("nama_jabatan", nama_jabatan.value);
    formData.append("status", status.value);

    //store data with API
    await api.post('/api/jabatan', formData)
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
      <p class="text-uppercase text-sm fw-bold fw-bold">Tambah Data Jabatan</p>
    <form @submit.prevent="storeJabatan()">
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nama Jabatan</label>
                                <input type="text" class="form-control" v-model="nama_jabatan" placeholder="Nama Jabatan">
                                <div v-if="errors.nama_jabatan" class="alert alert-danger mt-2">
                                    <span>{{ errors.nama_jabatan[0] }}</span>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn btn-md btn-primary rounded-sm shadow border-0 me-2">Save</button>
                            <router-link :to="{ name: 'Data Jabatan' }" class= "btn btn-outline-secondary rounded-sm shadow border-0 mb-3 me-2">Batal</router-link>
                        </form>
                      </div>
    </div>
  </div>
</template>
