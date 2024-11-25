<script setup>
    //import ref and onMounted
    import { ref, onMounted } from "vue";

    //import router
    import { useRouter } from 'vue-router';

    //import api
    import api from "../../api";

    //init router
    const router = useRouter();

    //define state
    const nama = ref("");
    const alamat = ref("");
    const jenkel = ref("");
    const no_hp = ref("");
    const tujuan = ref("");
    const nama_tujuan = ref("");
    const keperluan = ref("");
    const photo = ref("");
    const file = ref("");
    const errors = ref([]);

    //method for handle file changes
    const handleFileChange = (type, e) => {
        if (type == 'photo') {
            photo.value = e.target.files[0];
        } else if (type == 'file') {
            file.value = e.target.files[0];
        }
    };

    const dataURLToBlob = (dataURL) => {
        const byteString = atob(dataURL.split(',')[1]);
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    //method to store tamu
    const storeTamu = async () => {
        let formData = new FormData();
        const photoBlob = dataURLToBlob(photo.value);

        formData.append("nama", nama.value);
        formData.append("alamat", alamat.value);
        formData.append("jenkel", jenkel.value);
        formData.append("no_hp", no_hp.value);
        formData.append("tujuan", tujuan.value);
        formData.append("nama_tujuan", nama_tujuan.value);
        formData.append("keperluan", keperluan.value);
        formData.append("photo", photoBlob);
        formData.append("file", file.value);

        await api.post('/api/tamu', formData)
            .then(() => {
                router.push({ path: "/tamu" });
            })
            .catch((error) => {
                errors.value = error.response.data;
            });
    };

    const video = ref(null);
    const canvas = ref(null);

    const startWebcam = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                video.value.srcObject = stream;
            })
            .catch((err) => {
                console.error("Error accessing webcam: ", err);
            });
    };

    const capture = () => {
        const context = canvas.value.getContext("2d");
        context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);
        photo.value = canvas.value.toDataURL("image/png");
    };

    onMounted(() => {
        startWebcam();
    });

    //define state
    const pegawais = ref([]);

    //method fetchDataPegawais
    const fetchDataPegawais = async () => {

        //fetch data 
        await api.get('/api/pegawai')

        .then(response => {

            //set response data to state "pegawai"
            pegawais.value = response.data.data.data

        });
    }
    //run hook "onMounted"
    onMounted(() => {

//call method "fetchDataPegawais"
fetchDataPegawais();
});

//define state
const bagians = ref([]);

//method fetchDataPosts
const fetchDataBagians = async () => {

    //fetch data 
    await api.get('/api/bagian')

    .then(response => {

        //set response data to state "posts"
        bagians.value = response.data.data.data

    });
}

//run hook "onMounted"
onMounted(() => {

//call method "fetchDataPegawais"
fetchDataBagians();
});

</script>

<template>
    <div class="py-4 container-fluid">
        <div class="row">
            <!-- Left Card: Input Data -->
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header pb-0">
                        <p class="text-uppercase text-sm fw-bold"><i class="fas fa-user-check">&nbsp;&nbsp;</i>IDENTITAS TAMU</p>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Nama</label>
                            <input type="text" class="form-control" v-model="nama" placeholder="Nama Lengkap">
                            <div v-if="errors.nama" class="alert alert-danger mt-2">
                                <span>{{ errors.nama[0] }}</span>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Alamat</label>
                            <textarea class="form-control" v-model="alamat" placeholder="Alamat"></textarea>
                            <div v-if="errors.alamat" class="alert alert-danger mt-2">
                                <span>{{ errors.alamat[0] }}</span>
                            </div>
                        </div>

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

                        <div class="mb-3">
                            <label class="form-label fw-bold">No Whatsapp</label>
                            <input type="text" class="form-control" v-model="no_hp" placeholder="Nomor Whatsapp">
                            <div v-if="errors.no_hp" class="alert alert-danger mt-2">
                                <span>{{ errors.no_hp[0] }}</span>
                            </div>
                        </div>

                        <br><p class="text-uppercase text-sm fw-bold"><i class="fas fa-arrow-circle-right">&nbsp;&nbsp;</i>TUJUAN</p>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Bagian</label>
                            <select class="form-select" v-model="tujuan">
                                <option disabled value="">::Pilih Bagian::</option>
                                <option v-for="(bagian, index) in bagians" :value="bagian.nama_bagian" :key="index">{{ bagian.nama_bagian }}</option>
                                <!-- Add more options as needed --> 
                            </select>
                            <div v-if="errors.tujuan" class="alert alert-danger mt-2">
                                <span>{{ errors.tujuan[0] }}</span>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Nama Pegawai Yang Dituju</label>
                            <select class="form-select" v-model="nama_tujuan">
                                <option disabled value="">::Pilih yang dituju::</option>
                                <option v-for="(pegawai, index) in pegawais" :value="pegawai.nama" :key="index">{{ pegawai.nama }}</option>
                                
                            </select>
                            <div v-if="errors.nama_tujuan" class="alert alert-danger mt-2">
                                <span>{{ errors.nama_tujuan[0] }}</span>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Keperluan Bertamu</label>
                            <textarea class="form-control" v-model="keperluan" placeholder="Masukan Tujuan Bertamu"></textarea>
                            <div v-if="errors.keperluan" class="alert alert-danger mt-2">
                                <span>{{ errors.keperluan[0] }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Card: Input Tujuan -->
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header pb-0">
                        <p class="text-uppercase text-sm fw-bold"><i class="fa fa-file">&nbsp;&nbsp;</i>LAMPIRAN FILE</p>
                    </div>
                    <div class="card-body">
                                               
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold">Lampiran</label>
                            <input type="file" class="form-control" @change="handleFileChange('file', $event)">
                            <div v-if="errors.file" class="alert alert-danger mt-2">
                                <span>{{ errors.file[0] }}</span>
                            </div>
                        </div>

                        
                        <br><p class="text-uppercase text-sm fw-bold"><i class="fa fa-camera">&nbsp;&nbsp;</i>FOTO TAMU</p>
                    

                        <div class="mb-3">
                            <video ref="video" width="500" height="300" autoplay></video>
                            <button @click="capture" class="btn btn-md btn-primary rounded-sm shadow border-0 me-2 ms-5">Ambil Foto</button>
                            <div class="mb-3">
                            <canvas ref="canvas" width="450" height="300" style="display:none"></canvas>
                            <img :src="photo" alt=""/>
                            </div>
                            <div v-if="errors.photo" class="alert alert-danger mt-2">
                                <span>{{ errors.photo[0] }}</span>
                            </div>
                        </div>

                        <button @click="storeTamu" class="btn btn-md btn-primary rounded-sm shadow border-0 me-2">Save</button>
                        <router-link :to="{ name: 'Data Tamu' }" class="btn btn-outline-secondary rounded-sm shadow border-0 mb-3 me-2">Batal</router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
