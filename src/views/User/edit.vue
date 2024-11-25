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
const usernameFailed = ref(false);

//define state
const name = ref("");
const jenkel = ref("");
const username = ref("");
const password = ref(null);
const confirmPassword = ref(""); // State untuk konfirmasi password
const email = ref("");
const nohp = ref("");
const status = ref("Aktif");
const level = ref("");
const photo = ref("");
const errors = ref([]);

//onMounted
onMounted(async () => {
  //fetch detail data user by ID
  await api.get(`/api/users/${route.params.id}`).then((response) => {
    //set response data to state
    name.value = response.data.data.name;
    jenkel.value = response.data.data.jenkel;
    username.value = response.data.data.username;
    email.value = response.data.data.email;
    nohp.value = response.data.data.nohp;
    status.value = response.data.data.status;
    level.value = response.data.data.level;
    photo.value = response.data.data.photo;
  });
});

//method "updatePegawai"
const updateUser = async () => {
  // Reset error

  // Validasi konfirmasi password

  //init formData
  let formData = new FormData();

  //assign state value to formData

  formData.append("name", name.value);
  formData.append("jenkel", jenkel.value);
  formData.append("username", username.value);
  formData.append("password", password.value);
  formData.append("email", email.value);
  formData.append("nohp", nohp.value);
  formData.append("status", status.value);
  formData.append("level", level.value);
  // Hanya kirim file foto jika ada perubahan
  if (photo.value instanceof File) {
    formData.append("photo", photo.value); // Kirim jika photo adalah file baru
  }

  formData.append("_method", "PATCH");

  //store data with API
  await api
    .post(`/api/users/${route.params.id}`, formData)
    .then(() => {
      //redirect
      router.push({ path: "/user" });
    })
    .catch((error) => {
      //assign response error data to state "errors"
      usernameFailed.value = true;
      errors.value = error.response.data;
    });
};

//method for handle file changes
const handleFileChange = (e) => {
  //assign file to state
  photo.value = e.target.files[0];
};

//define state
const users = ref([]);

//method fetchDataPosts
const fetchDataUsers = async () => {
  //fetch data
  await api
    .get("/api/users")

    .then((response) => {
      //set response data to state "posts"
      users.value = response.data.data.data;
    });
};

//run hook "onMounted"
onMounted(() => {
  //call method "fetchDataPegawais"
  fetchDataUsers();
});
</script>
<template>
  <div class="py-4 container-fluid px-8">
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header pb-0"></div>
          <div class="card-body">
            <p class="text-uppercase text-sm fw-bold">Edit Data User</p>
            <form @submit.prevent="updateUser()">
              <!-- Form Nama -->
              <div class="mb-3">
                <label class="form-label fw-bold">Nama</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="name"
                  placeholder="Nama Lengkap"
                />
                <div v-if="errors.name" class="alert alert-danger mt-2">
                  <span>{{ errors.name[0] }}</span>
                </div>
              </div>

              <!-- Form Email -->
              <div class="mb-3">
                <label class="form-email fw-bold">Email</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="email"
                  placeholder="Email"
                />
                <div v-if="errors.email" class="alert alert-danger mt-2">
                  <span>{{ errors.email[0] }}</span>
                </div>
              </div>

              <!-- Form Jenis Kelamin -->
              <div class="mb-3">
                <label class="form-label fw-bold">Jenis Kelamin</label>
                <select class="form-select" v-model="jenkel">
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
                <div v-if="errors.jenkel" class="alert alert-danger mt-2">
                  <span>{{ errors.jenkel[0] }}</span>
                </div>
              </div>

              <!-- Form Username -->
              <div class="mb-3">
                <label class="form-label fw-bold">Username</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="username"
                  placeholder="Username"
                />
                <div v-if="errors.username" class="alert alert-danger mt-2">
                  <span>{{ errors.username[0] }}</span>
                </div>
                <div v-if="usernameFailed" class="alert alert-danger">
                  Username Telah Terdaftar.
                </div>
              </div>

              <!-- Form Password -->
              <div class="mb-3">
                <label class="form-label fw-bold">Password</label>
                <input
                  type="password"
                  class="form-control"
                  v-model="password"
                  placeholder="Password"
                />
                <div v-if="errors.password" class="alert alert-danger mt-2">
                  <span>{{ errors.password[0] }}</span>
                </div>
              </div>

              <!-- Form Konfirmasi Password -->
              <div class="mb-3">
                <label class="form-label fw-bold">Konfirmasi Password</label>
                <input
                  type="password"
                  class="form-control"
                  v-model="confirmPassword"
                  placeholder="Konfirmasi Password"
                />
                <!-- <div v-if="errors.confirmPassword" class="alert alert-danger mt-2">
                  <span>{{ errors.confirmPassword[0] }}</span>
                </div> -->
              </div>

              <!-- Form Nomor HP -->
              <div class="mb-3">
                <label class="form-label fw-bold">Nomor HP</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="nohp"
                  placeholder="Nomor HP"
                />
                <div v-if="errors.nohp" class="alert alert-danger mt-2">
                  <span>{{ errors.nohp[0] }}</span>
                </div>
              </div>

              <!-- Form Level -->
              <div class="mb-3">
                <label class="form-label fw-bold">Level</label>
                <select class="form-select" v-model="level">
                  <option>Administrator</option>
                  <option>Petugas</option>
                </select>
                <div v-if="errors.level" class="alert alert-danger mt-2">
                  <span>{{ errors.level[0] }}</span>
                </div>
              </div>

              <!-- Form Photo -->
              <div class="mb-3">
                <label class="form-label fw-bold">Photo</label>
                <input
                  type="file"
                  class="form-control"
                  @change="handleFileChange($event)"
                />
                <div class="text-center mt-3">
                  <img :src="photo" alt="" width="300" height="300" />
                </div>
                <div v-if="errors.photo" class="alert alert-danger mt-2">
                  <span>{{ errors.photo[0] }}</span>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-md btn-primary rounded-sm shadow border-0 me-2"
              >
                Save
              </button>
              <router-link
                :to="{ name: 'Data User' }"
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
