# Sambung Ayat · Benang — Panduan Penggunaan Logo

Versi 1.0 · November 2026

Paket ini berisi logo **Benang** (konsep 01) untuk aplikasi dan situs Sambung Ayat: ikon Android, iOS, web, PNG transparan, SVG master, dan panduan ini.

## 1. Gagasan logo

Tiga baris ayat disambung satu benang menjadi huruf **S**. Baris terakhir berwarna coklat stempel: baris yang harus kamu sambung sendiri. Tidak ada tulisan Arab, ayat, nama Allah, kaligrafi, atau simbol religius di dalamnya. Itu disengaja dan tidak boleh diubah.

## 2. Isi paket

| Folder | Isi | Dipakai untuk |
|---|---|---|
| `svg/` | Master vektor: simbol, wordmark, lockup horizontal & vertikal, 5 varian warna; `app-icon/`, `media/` | Sumber semua turunan, cetak, spanduk |
| `png-transparan/` | PNG tanpa latar: simbol (16–1024 px), wordmark, lockup horizontal, lockup vertikal (lebar 400–3200 px), 5 varian warna | Slide, dokumen, media sosial, stiker, sertifikat |
| `android/res/` | `mipmap-*` (ikon adaptif, monokrom, legacy bulat/persegi), `mipmap-anydpi-v26`, `values`, `drawable-*` (ikon notifikasi putih) | Salin ke `app/src/main/res/` |
| `android/vector-alternatif/` | Versi VectorDrawable untuk ikon adaptif dan notifikasi | Pengganti PNG bila ingin APK lebih kecil |
| `android/adaptive-layers-1024/` | Layer foreground, background, monochrome 1024 px | Flutter, Capacitor, Expo, atau generator ikon lain |
| `android/play-store/` | `ic_launcher-512.png`, `feature-graphic-1024x500.png` | Google Play Console |
| `ios/AppIcon.appiconset/` | Ikon 1024 px terang, gelap, dan tinted + `Contents.json` | Xcode 15 ke atas (satu ukuran) |
| `ios/legacy-AppIcon.appiconset/` | Set ukuran lengkap iPhone/iPad + `Contents.json` | Xcode lama atau toolchain yang minta semua ukuran |
| `web/` | `favicon.ico`, `favicon.svg`, PNG 16/32/48, `apple-touch-icon.png`, ikon PWA 192/512 (biasa dan maskable), `site.webmanifest`, `head-snippet.html`, `og-image-1200x630.png`, logo SVG untuk header | Folder root situs |

Penamaan varian warna:

- `warna`: simbol teal + coklat, teks teal. Untuk latar krem/putih.
- `warna-gelap`: simbol krem + tan, teks krem. Untuk latar teal, teal malam, atau hampir hitam.
- `mono-teal`, `mono-putih`, `mono-hitam`: satu warna. Untuk cetak satu warna, stempel, emboss, watermark, dan latar foto.

## 3. Warna dan huruf

| Peran | Nama | Hex |
|---|---|---|
| Utama | Teal dalam | `#0d5750` |
| Mode gelap | Teal malam | `#0f433d` |
| Kertas | Krem | `#f6f0de` |
| Aksen simbol | Coklat stempel | `#8a5230` |
| Aksen di latar gelap | Tan | `#d9b382` |
| Hampir hitam | Tinta | `#10201d` |

- Coklat stempel `#8a5230` adalah nilai perkiraan. Ganti bila warna stempel di aplikasi berbeda, lalu ekspor ulang.
- Kontras kira-kira: coklat di atas krem 5,5:1; krem di atas teal 7,4:1; tan di atas teal 4,3:1. Untuk elemen grafis batasnya 3:1, jadi semuanya lolos.
- **Jangan pakai biru atau ungu**, dan jangan pakai gradasi.
- Wordmark memakai **Sofia Sans Semi Condensed Bold (700)**, sudah dikonversi ke kurva, jadi tidak perlu memasang font. Font berlisensi SIL Open Font License, aman dipakai untuk logo. Teks tagline di `og-image` dan feature graphic memakai Semi Condensed 600.
- Penulisan nama: **Sambung Ayat** (huruf kapital di awal tiap kata). Bukan SAMBUNG AYAT, bukan sambungayat di teks biasa.

## 4. Ruang bersih dan ukuran minimum

- **Ruang bersih:** sisakan ruang kosong di semua sisi sebesar **seperempat tinggi simbol** (satu "x"). Tidak boleh ada teks, tepi halaman, atau gambar lain di dalamnya. Berkas PNG/SVG hanya punya ruang kecil di tepi supaya mudah diposisikan, jadi ruang bersih harus kamu atur di tata letak.
- **Ukuran minimum:**

| Versi | Layar | Cetak |
|---|---|---|
| Simbol saja | 16 px | 6 mm |
| Lockup horizontal | 88 px lebar | 24 mm lebar |
| Lockup vertikal | 64 px lebar | 18 mm lebar |

- Di bawah 24 px, atau saat hanya ada satu tinta, pakai simbol satu warna (`mono-*`). Pada 16 px, warna coklat dan teal sulit dibedakan; yang terbaca adalah bentuk S.
- **Mana yang dipakai:** header situs dan splash screen pakai lockup horizontal; poster dan sertifikat pakai lockup vertikal; avatar media sosial dan ikon pakai simbol.

## 5. Latar yang boleh

| Latar | Varian |
|---|---|
| Krem `#f6f0de`, putih | `warna` |
| Teal `#0d5750`, teal malam `#0f433d`, hampir hitam `#10201d` | `warna-gelap` |
| Foto atau latar ramai | `mono-putih` atau `mono-hitam`, dengan lapisan penutup agar kontras jelas |
| Cetak satu warna, stempel, emboss | `mono-hitam` atau `mono-teal` |

Di dalam ikon aplikasi, selalu pakai latar teal (Android/iOS terang/web) atau hampir hitam (iOS gelap).

## 6. Arah kanan-ke-kiri (Arab, Urdu)

- **Simbol tidak pernah dicerminkan.** Ia adalah huruf S, bukan panah; versi cermin terbaca sebagai bentuk lain.
- Di tata letak RTL, **posisi** logo ikut berpindah: lockup horizontal diletakkan di sisi kanan (awal baris). Gunakan berkas apa adanya, jangan di-flip. Wordmark Latin tetap dibaca kiri-ke-kanan.
- Pendamping tulisan Arab/Jawi **belum disertakan**. Ejaan "سمبوڠ ايات" perlu dicek penutur Jawi dulu. Bila sudah dikonfirmasi, tulis dengan font sans polos (misalnya Noto Sans Arabic), lebih kecil dari teks Latin, dan jangan memakai font kaligrafi atau Naskh bergaya mushaf.

## 7. Pemasangan

**Android (native)**
1. Salin isi `android/res/` ke `app/src/main/res/` (gabungkan folder). Pastikan `compileSdk` 33 atau lebih agar tag `<monochrome>` dikenali.
2. Di `AndroidManifest.xml`: `android:icon="@mipmap/ic_launcher"` dan `android:roundIcon="@mipmap/ic_launcher_round"`.
3. Ikon notifikasi: `.setSmallIcon(R.drawable.ic_stat_sambungayat)`. Ikon putih 24 dp ini dipakai Android untuk status bar, jangan diberi warna sendiri.
4. Mau versi vektor? Salin isi `android/vector-alternatif/res/` dan hapus PNG `ic_launcher_foreground` / `ic_launcher_monochrome` dari `mipmap-*` supaya tidak bentrok.

**Flutter / Capacitor / Expo:** gunakan `android/adaptive-layers-1024/` (foreground, background, monochrome) dan `ios/AppIcon.appiconset/AppIcon-1024.png`. Warna latar adaptif: `#0d5750`.

**Google Play:** unggah `android/play-store/ic_launcher-512.png` (tanpa sudut membulat; Play yang memotongnya) dan `feature-graphic-1024x500.png`.

**iOS:** tarik folder `AppIcon.appiconset` ke `Assets.xcassets` (ganti yang lama). Ikon dibuat persegi penuh tanpa transparansi; iOS yang membulatkan sudutnya. Varian gelap dan tinted sudah ada. Bila Xcode kamu minta semua ukuran, pakai `legacy-AppIcon.appiconset`.

**Web:** salin isi `web/` ke root situs, lalu tempel `head-snippet.html` ke `<head>`. Ubah URL `og:image` sesuai domain. `site.webmanifest` sudah berisi ikon biasa dan maskable.

## 8. Ketentuan Android yang dipenuhi

- Simbol berada di dalam zona aman 66 dp dari kanvas 108 dp: titik terjauh 31,7 dp dari tengah (batas 33 dp), jadi aman untuk topeng bulat, squircle, dan persegi membulat.
- `ic_launcher_monochrome` memakai satu bentuk S bersambung, untuk ikon tema Android 13.
- Ikon notifikasi hanya putih dan transparan, terbaca pada 24 px.
- Lockup, simbol, dan ikon semua tetap terbaca dalam satu warna.

## 9. Jangan

- Jangan mencerminkan, memutar, memiringkan, atau meregangkan simbol.
- Jangan mengganti warna di luar palet: tanpa biru, ungu, atau gradasi.
- Jangan memecah benang menjadi tiga garis terpisah.
- Jangan memakai coklat stempel di atas teal atau hitam; pakai tan (varian `warna-gelap`).
- Jangan menaruh logo di atas teks ayat, atau menempelkan kaligrafi atau ayat ke dalam atau di dekat simbol.
- Jangan menambah bayangan, 3D, kilau, kontur, atau maskot.
- Jangan menggambar ulang wordmark dengan font lain; pakai berkas yang disediakan.
- Jangan menambahkan klaim "resmi", "tersertifikasi", atau logo lembaga lain di dalam simbol. Sambung Ayat adalah alat bantu murajaah, bukan pengganti talaqqi.

## 10. Catatan sebelum rilis

- Cek apakah mark mirip dengan ikon aplikasi Al-Qur'an atau pendidikan lain di Google Play sebelum mendaftarkan merek atau mencetak massal. Pencarian itu belum dilakukan.
- Konfirmasi nilai coklat stempel dan ejaan Jawi (bagian 3 dan 6).
- Sertakan hak cipta font (SIL OFL) bila kamu menyalin berkas font ke repositori; untuk logo yang sudah berupa kurva, tidak wajib.
