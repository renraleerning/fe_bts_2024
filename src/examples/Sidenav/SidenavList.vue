<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

import SidenavItem from "./SidenavItem.vue";
import SidenavCard from "./SidenavCard.vue";

const store = useStore();
const isRTL = computed(() => store.state.isRTL);

const getRoute = () => {
  const route = useRoute();
  const routeArr = route.path.split("/");
  return routeArr[1];
};
</script>
<template>
  <div
    class="collapse navbar-collapse w-auto h-auto h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">
      <li class="nav-item">
        <sidenav-item
          to="/tamu"
          :class="getRoute() === 'tamu' ? 'active' : ''"
          :navText="isRTL ? 'لوحة القيادة' : 'Daftar Tamu'"
        >
          <template v-slot:icon>
            <i class="ni ni-tv-2 text-primary text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="mt-3 nav-item">
        <h6
          v-if="isRTL"
          class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
          :class="isRTL ? 'me-4' : 'ms-2'"
        >
          صفحات المرافق
        </h6>

        <h6
          v-else
          class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
          :class="isRTL ? 'me-4' : 'ms-2'"
        >
          Data Master
        </h6>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/user"
          :class="getRoute() === 'user' ? 'active' : ''"
          :navText="isRTL ? 'حساب تعريفي' : 'User'"
        >
          <template v-slot:icon>
            <i class="ni ni-single-02 text-dark text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/bagian"
          :class="getRoute() === 'bagian' ? 'active' : ''"
          :navText="isRTL ? 'الواقع الافتراضي' : 'Bagian/Department'"
        >
          <template v-slot:icon>
            <i class="ni ni-app text-info text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/jabatan"
          :class="getRoute() === 'jabatan' ? 'active' : ''"
          :navText="isRTL ? 'تسجيل الدخول' : 'Master Jabatan'"
        >
          <template v-slot:icon>
            <i class="ni ni-single-copy-04 text-danger text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/pegawai"
          :class="getRoute() === 'pegawai' ? 'active' : ''"
          :navText="isRTL ? 'اشتراك' : 'Pegawai'"
        >
          <template v-slot:icon>
            <i class="ni ni-collection text-info text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <hr class="mt-0 horizontal dark" />

      <div class="text-center">
      <router-link :to="{ name: 'Laporan' }">
        <img
          :class="getRoute() === 'signin' ? 'active' : 'w-50 mx-auto'"
          src="@/assets/img/illustrations/icon-documentation.svg"
          alt="sidebar_illustration"
        /> 
        <h6  class="text-xs text-uppercase font-weight-bolder opacity-6">Laporan</h6>
      </router-link>
      </div>
    </ul>
  </div>

  <div class="pt-3 mx-3 mt-3 sidenav-footer">
    <sidenav-card
      :card="{
        title: 'Need Help?',
        description: 'Please check our docs',
        links: [
          {
            label: 'Documentation',
            route:
              'https://www.creative-tim.com/learning-lab/vue/overview/argon-dashboard/',
            color: 'dark',
          },
          {
            label: 'Buy now',
            route:
              'https://www.creative-tim.com/product/vue-argon-dashboard-pro?ref=vadp',
            color: 'success',
          },
        ],
      }"
    />
  </div>
</template>
