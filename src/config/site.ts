export const SITE = {
  name: "Sambung Ayat",
  url: "https://sambungayat.com",
  tagline: "Latih hafalan Al-Qur'an dengan 6 jenis kuis",
  description:
    "Kuis hafalan Al-Qur'an gratis: sambung ayat, tebak surah, lengkapi ayat, dan tebak ayat dari audio. Tanpa login, bisa dipakai offline.",
  ogImage: "/og-default.png",
  /** Public repository URL; shown on /tentang when set. */
  repo: "https://github.com/afdaliable/sambungayat",
  /** Contact email; /kontak shows the mail form only when set. */
  email: "halo@sambungayat.com",
} as const;

export const MODES = [
  { id: "sambung", title: "Sambung Ayat", desc: "Lihat satu ayat, pilih ayat berikutnya." },
  { id: "tebak-surah", title: "Tebak Surah", desc: "Lihat satu ayat, tebak nama surahnya." },
  { id: "lengkapi", title: "Lengkapi Ayat", desc: "Ayat dengan kata terakhir disembunyikan." },
  {
    id: "tebak-audio",
    title: "Tebak Ayat dari Audio",
    desc: "Dengarkan murattal, pilih teksnya. Butuh internet.",
  },
  { id: "tebak-juz", title: "Tebak Juz", desc: "Lihat satu ayat, tebak ada di juz berapa." },
  {
    id: "sebelum",
    title: "Ayat Sebelumnya",
    desc: "Lihat satu ayat, pilih ayat yang mendahuluinya.",
  },
] as const;
