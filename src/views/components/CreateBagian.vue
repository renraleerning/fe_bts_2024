<script setup>

//import ArgonInput from "@/components/ArgonInput.vue";
//import ref
import { ref } from "vue";

//import router
import { useRouter } from 'vue-router';

//import api
import api from "../../api";

//init router
const router = useRouter();

//define state
const nama_bagian = ref("");
const status = ref("Aktif");
const errors = ref([]);


//method "storePost"
const storePost = async () => {

    //init formData
    let formData = new FormData();

    //assign state value to formData
    formData.append("nama_bagian", nama_bagian.value);
    formData.append("status", status.value);

    //store data with API
    await api.post('/api/bagian', formData)
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
      <p class="text-uppercase text-sm fw-bold">Tambah Data Bagian</p>
    <form @submit.prevent="storePost()">
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nama Bagian</label>
                                <input type="text" class="form-control" v-model="nama_bagian" placeholder="Nama Bagian/Department">
                                <div v-if="errors.nama_bagian" class="alert alert-danger mt-2">
                                    <span>{{ errors.nama_bagian[0] }}</span>
                                </div>
                            </div>
                            <!-- <div class="mb-3">
                                <label class="form-label fw-bold">Status</label>
                                <input type="text" class="form-control" v-model="status" value="Aktif">
                                <div v-if="errors.status" class="alert alert-danger mt-2">
                                    <span>{{ errors.status[0] }}</span>
                                </div>
                            </div> -->
                            <button type="submit" class="btn btn-md btn-primary rounded-sm shadow border-0 me-2">Save</button>
                            <router-link :to="{ name: 'Data Bagian' }" class= "btn btn-outline-secondary rounded-sm shadow border-0 mb-3 me-2">Batal</router-link>
                        </form>
                      </div>
    </div>
  </div>
</template>
