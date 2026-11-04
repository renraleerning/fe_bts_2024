import { createRouter, createWebHistory } from "vue-router";
import DataTamu from "../views/DataTamu.vue";
import DataUser from "../views/DataUser.vue";
import DataJabatan from "../views/DataJabatan.vue";
import DataPegawai from "../views/DataPegawai.vue";
import DataBagian from  "../views/DataBagian.vue";
import DataLaporan from  "../views/DataLaporan.vue";
import CreateUser from "../views/User/create.vue";
import CreatePegawai from "../views/Pegawai/create.vue";
import CreateTamu from "../views/Tamu/create.vue";
import EditPegawai from "../views/Pegawai/edit.vue";
import EditTamu from "../views/Tamu/edit.vue";
import EditUser from "../views/User/edit.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";
import IndexEvent from "../views/Event/IndexEvent.vue";
import DetailEventTamu from "../views/Event/DetailEventTamu.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    meta: { title: "Presensi Buku Tamu Mandiri", isPublic: true },
    component: CreateTamu,
  },
  {
    path: "/tamu",
    name: "Data Tamu",
    meta: { title: "Data Tamu", requiresAuth: true },
    component: DataTamu,
  },
  {
    path: "/createtamu",
    name: "Create.Tamu",
    meta: { title: "Tambah Data Tamu", isPublic: true },
    component: CreateTamu,
  },
  {
    path: "/edittamu/:id",
    name: "Edit.Tamu",
    meta: { title: "Edit Data Tamu", requiresAuth: true },
    component: EditTamu,
  },
  {
    path: "/user",
    name: "Data User",
    meta: { title: "Data User", requiresAuth: true, requiresAdmin: true },
    component: DataUser,
  },
  {
    path: "/createuser",
    name: "Create.User",
    meta: { title: "Tambah Data User", requiresAuth: true, requiresAdmin: true },
    component: CreateUser,
  },
  {
    path: "/edituser/:id",
    name: "Edit.User",
    meta: { title: "Pengaturan Profil", requiresAuth: true, allowSelfEdit: true },
    component: EditUser,
  },
  {
    path: "/bagian",
    name: "Data Bagian",
    meta: { title: "Data Bagian", requiresAuth: true, requiresAdmin: true },
    component: DataBagian,
  },
  {
    // Redirect old create route → index page with query flag to auto-open modal
    path: "/createbagian",
    name: "Create.Bagian",
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: { path: "/bagian", query: { action: "create" } },
  },
  {
    // Redirect old edit route → index page with query flag to auto-open modal
    path: "/editbagian/:id",
    name: "Edit.Bagian",
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: (to) => ({ path: "/bagian", query: { editId: to.params.id } }),
  },
  {
    path: "/jabatan",
    name: "Data Jabatan",
    meta: { title: "Data Jabatan", requiresAuth: true, requiresAdmin: true },
    component: DataJabatan,
  },
  {
    // Redirect old create route → index page with query flag to auto-open modal
    path: "/createjabatan",
    name: "Create.Jabatan",
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: { path: "/jabatan", query: { action: "create" } },
  },
  {
    // Redirect old edit route → index page with query flag to auto-open modal
    path: "/editjabatan/:id",
    name: "Edit.Jabatan",
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: (to) => ({ path: "/jabatan", query: { editId: to.params.id } }),
  },
  {
    path: "/pegawai",
    name: "Data Pegawai",
    meta: { title: "Data Pegawai", requiresAuth: true, requiresAdmin: true },
    component: DataPegawai,
  },
  {
    path: "/createpegawai",
    name: "Create.Pegawai",
    meta: { title: "Tambah Data Pegawai", requiresAuth: true, requiresAdmin: true },
    component: CreatePegawai,
  },
  {
    path: "/editpegawai/:id",
    name: "Edit.Pegawai",
    meta: { title: "Edit Data Pegawai", requiresAuth: true, requiresAdmin: true },
    component: EditPegawai,
  },
  {
    path: "/laporan",
    name: "Laporan",
    meta: { title: "Laporan Rekap Kunjungan", requiresAuth: true },
    component: DataLaporan,
  },
  {
    path: "/event",
    name: "Data Event",
    meta: { title: "Buku Tamu Event & Pameran", requiresAuth: true, requiresAdmin: true },
    component: IndexEvent,
  },
  {
    path: "/event/:id/tamu",
    name: "Detail.Event.Tamu",
    meta: { title: "Rekap Tamu Event", requiresAuth: true, requiresAdmin: true },
    component: DetailEventTamu,
  },
  {
    path: "/event/:id/presensi",
    name: "Event.Presensi.Public",
    meta: { title: "Presensi Event", isPublic: true },
    component: () => import("../views/Event/EventPresensiDirect.vue"),
  },
  {
    path: "/signin",
    name: "Signin",
    meta: { title: "Sign In", guestOnly: true },
    component: Signin,
  },
  {
    path: "/signup",
    name: "Signup",
    meta: { title: "Sign Up", guestOnly: true },
    component: Signup,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});

// Navigation Guard: Autentikasi & Otorisasi Hak Akses (Admin vs Petugas)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    const rawUser = localStorage.getItem("user");
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    user = null;
  }

  const level = (user?.level || "").toLowerCase().trim();
  const isAdmin = level === "admin" || level === "administrator";

  // Document Title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - BTS Buku Tamu Sekolah`;
  }

  // 1. Rute khusus Tamu (Guest) yang belum login: Jika sudah login, lempar ke /tamu
  if (to.meta?.guestOnly && token) {
    return next({ path: "/tamu" });
  }

  // 2. Rute yang mewajibkan Login: Jika belum login, lempar ke /signin
  if (to.meta?.requiresAuth && !token) {
    return next({ path: "/signin" });
  }

  // 3. Rute khusus Administrator (User list, Create User, Bagian, Jabatan, Pegawai):
  // Jika yang login Petugas (bukan Admin), tolak akses dan arahkan ke /tamu
  if (to.meta?.requiresAdmin && !isAdmin) {
    return next({ path: "/tamu", query: { accessDenied: "1" } });
  }

  // 4. Rute Edit User / Pengaturan Profil:
  // Admin bebas mengedit user manapun. Petugas HANYA boleh mengedit akun profil miliknya sendiri.
  if (to.name === "Edit.User" && !isAdmin) {
    const isEditingSelf = user && user.id && String(user.id) === String(to.params.id);
    if (!isEditingSelf) {
      return next({ path: "/tamu", query: { accessDenied: "1" } });
    }
  }

  next();
});

export default router;
