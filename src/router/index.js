import { createRouter, createWebHistory } from "vue-router";
import DataTamu from "../views/DataTamu.vue";
import DataUser from "../views/DataUser.vue";
import DataJabatan from "../views/DataJabatan.vue";
import DataPegawai from "../views/DataPegawai.vue";
import DataBagian from  "../views/DataBagian.vue";
import DataLaporan from  "../views/DataLaporan.vue";  
import CreateUser from "../views/User/create.vue";
import CreateBagian from "../views/Bagian/create.vue";
import CreateJabatan from "../views/Jabatan/create.vue";
import CreatePegawai from "../views/Pegawai/create.vue";
import CreateTamu from "../views/Tamu/create.vue";
import EditBagian from "../views/Bagian/edit.vue";
import EditJabatan from "../views/Jabatan/edit.vue";
import EditPegawai from "../views/Pegawai/edit.vue";
import EditTamu from "../views/Tamu/edit.vue";
import EditUser from "../views/User/edit.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";

const routes = [
  {
    path: "/",
    name: "/",
    redirect: "/dashboard-default",
  },
  {
    path: "/tamu",
    name: "Data Tamu",
    component: DataTamu,
  },
  {
    path: '/createtamu',
    name: 'Create.Tamu',
    component: CreateTamu,
  },
  {
    path: '/edittamu/:id',
    name: 'Edit.Tamu',
    component: EditTamu,
  },
  {
    path: "/user",
    name: "Data User",
    component: DataUser,
  },
  {
    path: '/createuser',
    name: 'Create.User',
    component: CreateUser,
  },
  {
    path: '/edituser/:id',
    name: 'Edit.User',
    component: EditUser,
  },
  {
    path: "/bagian",
    name: "Data Bagian",
    component: DataBagian,
  },
  {
    path: '/createbagian',
    name: 'Create.Bagian',
    component: CreateBagian,
  },
  {
    path: '/editbagian/:id',
    name: 'Edit.Bagian',
    component: EditBagian,
  },
  {
    path: "/jabatan",
    name: "Data Jabatan",
    component: DataJabatan,
  },
  {
    path: '/createjabatan',
    name: 'Create.Jabatan',
    component: CreateJabatan,
  },
  {
    path: '/editjabatan/:id',
    name: 'Edit.Jabatan',
    component: EditJabatan,
  },
  {
    path: "/pegawai",
    name: "Data Pegawai",
    component: DataPegawai,
  },
  {
    path: '/createpegawai',
    name: 'Create.Pegawai',
    component: CreatePegawai,
  },
  {
    path: '/editpegawai/:id',
    name: 'Edit.Pegawai',
    component: EditPegawai,
  },
  {
    path: "/laporan",
    name: "Laporan",
    component: DataLaporan,
  },
  {
    path: "/signin",
    name: "Signin",
    component: Signin,
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});

export default router;
