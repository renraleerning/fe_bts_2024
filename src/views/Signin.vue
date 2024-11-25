<script setup>
import { onBeforeUnmount, onBeforeMount, ref } from "vue";
import { useStore } from "vuex";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonSwitch from "@/components/ArgonSwitch.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

const user = ref({
  username: "",
  password: "",
  rememberMe: false,
});

const validation = ref([]);
const loginFailed = ref(false); // Set initial state to false

const login = async () => {
  validation.value = []; // Clear validation errors before sending request

  const username = user.value.username;
  const password = user.value.password;

  try {
    const response = await axios.post("http://localhost:8000/api/login", {
      username,
      password,
    });

    if (response.data.success) {
      localStorage.setItem("token", response.data.token);
      router.push({ name: "Data Tamu" });
      return; // Prevent unnecessary processing
    }

    // Set loginFailed state on failed login
  } catch (error) {
    loginFailed.value = true;
    console.error("Login error:", error);
    validation.value = error.response?.data || ["Error logging in"]; // Handle potential error response or set generic error message
  }
  return {
    user,
    validation,
    loginFailed,
    login,
  };
};

const body = document.getElementsByTagName("body")[0];

const store = useStore();
onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});
onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});
</script>
<template>
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row"></div>
  </div>
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">
            <div
              class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0"
            >
              <div class="card card-plain">
                <div class="pb-0 card-header text-start">
                  <div
                    v-if="loginFailed"
                    class="alert alert-danger text-center"
                  >
                    Username atau Password Anda salah.
                  </div>
                  <h4 class="font-weight-bolder">Sign In</h4>
                  <p class="mb-0">
                    Enter your username and password to sign in
                  </p>
                </div>
                <div class="card-body">
                  <form @submit.prevent="login" role="form">
                    <div class="mb-3">
                      <argon-input
                        type="text"
                        v-model="user.username"
                        placeholder="Username"
                      />
                    </div>
                    <div
                      v-if="validation.username"
                      class="mt-2 alert alert-danger"
                    >
                      {{ validation.username[0] }}
                    </div>
                    <div class="mb-3">
                      <argon-input
                        type="password"
                        v-model="user.password"
                        placeholder="Password"
                      />
                    </div>
                    <div
                      v-if="validation.password"
                      class="mt-2 alert alert-danger"
                    >
                      {{ validation.password[0] }}
                    </div>

                    <argon-switch
                      id="rememberMe"
                      name="remember-me"
                      v-model="user.rememberMe"
                    >
                      Remember me
                    </argon-switch>

                    <div class="text-center">
                      <argon-button
                        type="submit"
                        class="mt-4"
                        variant="gradient"
                        color="success"
                        fullWidth
                        size="lg"
                        >Sign in</argon-button
                      >
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div
              class="top-0 my-auto text-center col-6 d-lg-flex d-none h-100 pe-0 position-absolute end-0 justify-content-center flex-column"
            >
              <div
                class="gambar-signin position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
              >
              
                <span class="mask bg-gradient-success opacity-3"></span>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.gambar-signin {
  background-image: url('../../src/assets/img/bgdepan.png');
  background-size: 100% 100%;
}
</style>
