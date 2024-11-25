<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../../api";
import { saveAs } from 'file-saver';
//import * as XLSX from "xlsx"; // Import the xlsx library

// State variables
const tamus = ref([]); // Original data
const searchQuery = ref(""); // Search input
const perPage = ref(5); // Number of records per page
const currentPage = ref(1); // Current page
const fromDate = ref(""); // From date input
const toDate = ref(""); // To date input
const isFiltered = ref(false); // State to check if filter is applied

// Fetch guest data (tamu)
const fetchDataTamus = async () => {
  const response = await api.get("/api/tamu");
  tamus.value = response.data.data; 
};

// Filtered tamus based on the search query and date range
const filteredTamus = computed(() => {
  if (!isFiltered.value) return []; // Don't show data until filter is applied

  let filtered = tamus.value;

  // Filter based on the search query
  if (searchQuery.value) {
    filtered = filtered.filter((tamu) =>
      tamu.nama.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Filter based on the date range
  if (fromDate.value && toDate.value) {
    filtered = filtered.filter((tamu) => {
      const tamuDate = new Date(tamu.tgl_datang.split(" ")[0]); // Extract date from tgl_datang
      return tamuDate >= new Date(fromDate.value) && tamuDate <= new Date(toDate.value);
    });
  }

  return filtered;
});

// Get paginated guests for the current page based on filtered tamus
const paginatedTamus = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredTamus.value.slice(start, end);
});

// Total pages calculated from filtered tamus data
const totalPages = computed(() => {
  return Math.ceil(filteredTamus.value.length / perPage.value);
});

// Set the current page
const setPage = (page) => {
  currentPage.value = page;
};

// Move to the next page
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
};

// Move to the previous page
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

// Apply the filter when the user clicks "Cari"
const applyFilter = () => {
  // Check if both dates are filled
  if (!fromDate.value || !toDate.value) {
    alert("Silakan pilih tanggal terlebih dahulu.");
    return;
  }

  isFiltered.value = true;
  setPage(1); // Reset to first page after applying filter
};

// const exportToXLSX = () => {
//     if (!isFiltered.value || filteredTamus.value.length === 0) {
//         alert("Silakan pilih tanggal dan cari data terlebih dahulu.");
//         return;
//     }

//     // Gabungkan teks "Tanggal" dan rentang tanggal ke dalam satu string
//     const title = [
//         ["Laporan Data Tamu"], // Judul laporan
//         [`Tanggal: ${fromDate.value} - ${toDate.value}`], // Rentang tanggal dalam satu sel
//     ];

//     // Header kolom
//     const headers = [
//         ["No", "Tanggal", "Waktu", "Nama", "Jenis Kelamin", "Alamat", "No HP", "Keperluan", "Tujuan", "Nama Tujuan", "Lampiran", "Foto"],
//     ];

//     // Data tamu
//     const data = filteredTamus.value.map((tamu, index) => [
//         index + 1,
//         tamu.tgl_datang.split(" ")[0],
//         tamu.tgl_datang.split(" ")[1],
//         tamu.nama,
//         tamu.jenkel,
//         tamu.alamat,
//         tamu.no_hp,
//         tamu.keperluan,
//         tamu.tujuan,
//         tamu.nama_tujuan,
//         tamu.lampiran ? tamu.lampiran.file : "-",
//         tamu.photo ? tamu.photo : "-",
//     ]);

//     // Gabungkan title, headers, dan data menjadi satu array
//     const finalData = [...title, [], ...headers, ...data];

//     // Buat worksheet
//     const worksheet = XLSX.utils.aoa_to_sheet(finalData);

//     // Merge cells untuk judul utama
//     worksheet["!merges"] = [
//         { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Gabungkan sel A1 sampai L1 untuk judul
//         { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Gabungkan sel untuk rentang tanggal
//     ];

//    // Gaya untuk judul
// if (worksheet["A1"]) {
//     worksheet["A1"].s = {
//         font: { bold: true, sz: 16 },
//         alignment: { horizontal: "center", vertical: "center" },
//     };
// }

// // Gaya untuk rentang tanggal
// if (worksheet["A2"]) {
//     worksheet["A2"].s = {
//         font: { bold: true, sz: 12 },
//         alignment: { horizontal: "center" },
//     };
// }

// // Gaya untuk header
// const headerCellStyle = {
//     font: { bold: true },
//     alignment: { horizontal: "center" },
//     fill: {
//         fgColor: { rgb: "D9EAD3" }, // Warna latar belakang hijau muda
//     },
//     border: {
//         top: { style: "thin" },
//         bottom: { style: "thin" },
//         left: { style: "thin" },
//         right: { style: "thin" },
//     },
// };

// // Terapkan gaya ke header
// headers[0].forEach((_, index) => {
//     const cellRef = XLSX.utils.encode_cell({ r: 3, c: index });
//     if (worksheet[cellRef]) worksheet[cellRef].s = headerCellStyle;
// });

// // Gaya untuk sel data
// const dataCellStyle = {
//     alignment: { horizontal: "center" },
//     border: {
//         top: { style: "thin" },
//         bottom: { style: "thin" },
//         left: { style: "thin" },
//         right: { style: "thin" },
//     },
// };

// // Terapkan gaya ke sel data
// data.forEach((row, rowIndex) => {
//     row.forEach((_, colIndex) => {
//         const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
//         if (worksheet[cellRef]) worksheet[cellRef].s = dataCellStyle;
//     });
// });

// // Merge cells untuk judul
// worksheet["!merges"] = [
//     { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Gabungkan sel A1 sampai L1 untuk judul
//     { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Gabungkan sel untuk rentang tanggal
// ];

//     // Buat workbook dan tambahkan worksheet
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu");

//     // Ekspor ke file XLSX
//     XLSX.writeFile(workbook, "Laporan_Data_Tamu.xlsx");
// };

const exportData = async () => {

// Validasi: Cek apakah data sudah difilter atau belum
if (!isFiltered.value || filteredTamus.value.length === 0) {
    alert("Silahkan cari data terlebih dahulu!");
    return; // Hentikan fungsi jika belum difilter atau tidak ada data
  }

  //fetch data
  await api
    .get(
      "/api/exportTamu?dari=" +
        fromDate.value +
        "&sampai=" +
        toDate.value,
        {
        responseType: "arraybuffer",
      }
    )
    .then((response) => {
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "Laporan_Data_Tamu.xlsx");
    });
};


// Fetch data when component is mounted
onMounted(() => {
  fetchDataTamus();
});
</script>


<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>Laporan</h6>
      <!-- Search Form -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <!-- Date Input Form -->  
        <div class="d-flex align-items-center">
          <div class="input-group me-3">
            <label for="fromDate" class="form-label me-2">Dari Tanggal</label>
          <div>
            <input 
              type="date" 
              id="fromDate" 
              v-model="fromDate" 
              class="form-control" 
            />
            </div>
          </div>

          <div class="input-group me-3">
            <label for="toDate" class="form-label me-2">Ke Tanggal</label>
            <div>
            <input 
              type="date" 
              id="toDate" 
              v-model="toDate" 
              class="form-control" 
            />
            </div>
          </div>
        </div>
        
        <!-- Search and Export Buttons -->
        <div class="input-group">
          <div>
          <button class="btn btn-md btn-success rounded-sm shadow border-0 me-2 mt-5" @click="applyFilter">
            Cari
          </button>
        </div>
        <div>
          <button class="btn btn-info rounded-sm shadow border-0 mt-5" @click="exportData()">
            Ekspor
          </button>
        </div>
        </div>
      </div>
    </div>
    <!-- ... Rest of your template ... -->

    <div class="card-body px-0 pt-0 pb-2" v-if="isFiltered && filteredTamus.length > 0">
      <div class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">No</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Waktu Datang</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Photo</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Identitas</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Keperluan</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Tujuan Ke</th>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Lampiran</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tamu, index) in paginatedTamus" :key="index">
              <td class="ps-4 text-sm">{{ (currentPage - 1) * perPage + index + 1 }}</td>
              <td class="text-sm wrap-text">{{ tamu.tgl_datang}} <br> {{ new Date(tamu.created_at).toLocaleTimeString() }}
              </td>
              <td>
                <img :src="tamu.photo" width="100" height="100" class="rounded-2" />
              </td>
              <td class="text-sm">
                <b>{{ tamu.nama }}</b> ({{ tamu.jenkel }})<br />{{ tamu.alamat }}<br />No HP: <b>{{ tamu.no_hp }}</b>
              </td>
              <td class="text-sm">{{ tamu.keperluan }}</td>
              <td class="text-sm">{{ tamu.tujuan }} - <br>{{ tamu.nama_tujuan }}</td>
              <td v-if="tamu.lampiran" class="text-sm"><a :href="tamu.lampiran.file">File Lampiran</a></td>
              <td v-else>-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <nav aria-label="Page navigation example">
        <ul class="pagination justify-content-center mt-3">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link no-rounded" @click="prevPage">
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>
          <li class="page-item" :class="{ active: currentPage === 1 }">
            <button class="page-link no-rounded" @click="setPage(1)">1</button>
          </li>
          <li v-if="currentPage > 3" class="page-item disabled">
            <span class="page-link">...</span>
          </li>
          <li v-for="page in dynamicPages" :key="page" :class="{ active: currentPage === page }">
            <button class="page-link no-rounded" @click="setPage(page)">
              {{ page }}
            </button>
          </li>
          <li v-if="currentPage < totalPages - 2" class="page-item disabled">
            <span class="page-link">...</span>
          </li>
          <li class="page-item" :class="{ active: currentPage === totalPages }">
            <button class="page-link no-rounded" @click="setPage(totalPages)">
              {{ totalPages }}
            </button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button class="page-link no-rounded" @click="nextPage">
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- No data message -->
    <div class="card-body px-0 pt-0 pb-2" v-if="isFiltered && filteredTamus.length === 0">
      <div class="alert alert-danger mb-0">Data Belum Tersedia!</div>
    </div>
  </div>
</template>
