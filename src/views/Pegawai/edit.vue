<script setup>
//import ref
import { ref, onMounted } from "vue";

//import router
import { useRouter, useRoute } from "vue-router";

//import api
import api from "../../api";

//init router
const router = useRouter();

//init route
const route = useRoute();

//define state
const nip = ref("");
const nama = ref("");
const jabatan = ref("");
const bagian = ref("");
const no_hp = ref("");
const status = ref("");
const errors = ref([]);

//onMounted
onMounted(async () => {
  //fetch detail data pegawai by ID
  await api.get(`/api/pegawai/${route.params.id}`).then((response) => {
    //set response data to state
    nip.value = response.data.data.nip;
    nama.value = response.data.data.nama;
    jabatan.value = response.data.data.jabatan;
    bagian.value = response.data.data.bagian;
    no_hp.value = response.data.data.no_hp;
    status.value = response.data.data.status;
  });
});

//method "updatePegawai"
const updatePegawai = async () => {
  //init formData
  let formData = new FormData();

  //assign state value to formData

  formData.append("nip", nip.value);
  formData.append("nama", nama.value);
  formData.append("jabatan", jabatan.value);
  formData.append("bagian", bagian.value);
  formData.append("no_hp", no_hp.value);
  formData.append("status", status.value);
  formData.append("_method", "PATCH");

  //store data with API
  await api
    .post(`/api/pegawai/${route.params.id}`, formData)
    .then(() => {
      //redirect
      router.push({ path: "/pegawai" });
    })
    .catch((error) => {
      //assign response error data to state "errors"
      errors.value = error.response.data;
    });
};

//define state
const bagians = ref([]);

//method fetchDataPosts
const fetchDataBagians = async () => {
  //fetch data
  await api
    .get("/api/bagian")

    .then((response) => {
      //set response data to state "posts"
      bagians.value = response.data.data.data;
    });
};

//run hook "onMounted"
onMounted(() => {
  //call method "fetchDataPegawais"
  fetchDataBagians();
});

//define state
const jabatans = ref([]);

//method fetchDataPosts
const fetchDataJabatans = async () => {
  //fetch data
  await api
    .get("/api/jabatan")

    .then((response) => {
      //set response data to state "posts"
      jabatans.value = response.data.data.data;
    });
};

//run hook "onMounted"
onMounted(() => {
  //call method "fetchDataPegawais"
  fetchDataJabatans();
});
</script>
<template>
  <div class="py-4 container-fluid px-8">
    <div class="row">
      <div class="col-md-12">
        <div class="card">
      <div class="card-body">
        <p class="text-uppercase text-sm fw-bold fw-bold">Ubah Data Pegawai</p>
        <form @submit.prevent="updatePegawai()">
          <div class="mb-3">
            <label class="form-label fw-bold">NIP</label>
            <input
              type="text"
              class="form-control"
              v-model="nip"
              placeholder="NIP"
            />
            <div v-if="errors.nip" class="alert alert-danger mt-2">
              <span>{{ errors.nip[0] }}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Nama</label>
            <input
              type="text"
              class="form-control"
              v-model="nama"
              placeholder="Nama Lengkap"
            />
            <div v-if="errors.nama" class="alert alert-danger mt-2">
              <span>{{ errors.nama[0] }}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Jabatan</label>
            <div></div>
            <select class="form-select" v-model="jabatan">
              <option disabled value="">::Pilih Jabatan::</option>
                  <option
                    v-for="(jabatan, index) in jabatans"
                    :value="jabatan.nama_jabatan"
                    :key="index"
                  >
                    {{ jabatan.nama_jabatan }}
                  </option>
            </select>
            <div v-if="errors.jabatan" class="alert alert-danger mt-2">
              <span>{{ errors.jabatan[0] }}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Bagian</label>
            <div></div>
            <select class="form-select" v-model="bagian">
              <option disabled value="">::Pilih Bagian::</option>
                  <option
                    v-for="(bagian, index) in bagians"
                    :value="bagian.nama_bagian"
                    :key="index"
                  >
                    {{ bagian.nama_bagian }}
                  </option>
            </select>
            <div v-if="errors.bagian" class="alert alert-danger mt-2">
              <span>{{ errors.bagian[0] }}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Nomor HP</label>
            <input
              type="text"
              class="form-control"
              v-model="no_hp"
              placeholder="Nomor HP"
            />
            <div v-if="errors.no_hp" class="alert alert-danger mt-2">
              <span>{{ errors.no_hp[0] }}</span>
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
          <button
            type="submit"
            class="btn btn-md btn-primary rounded-sm shadow border-0 me-2"
          >
            Update
          </button>
          <router-link
            :to="{ name: 'Data Pegawai' }"
            class="btn btn-outline-secondary rounded-sm shadow border-0 mb-3 me-2"
            >Batal</router-link
          >
        </form>
      </div>
    </div>
    </div>
  </div> 
  </div>
</template>
