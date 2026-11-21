---
title: "Bagaimana soal bisa sama untuk semua orang tanpa server"
description: "Penjelasan sederhana cara Sambung Ayat membuat soal yang identik di semua perangkat lewat kode acak (seed), tanpa menyimpan apa pun di server."
date: 2026-11-23
ctaHref: /guru
ctaLabel: Buat tautan kuis
---

Tantangan Harian dan tautan guru punya satu sifat yang tampak ajaib: siapa pun yang membukanya mendapat **soal yang sama persis**, padahal tidak ada server yang membagikan soal. Berikut cara kerjanya, tanpa istilah teknis berlebihan.

## Acak yang bisa diulang

Komputer tidak benar-benar mengacak. Ia memakai rumus yang menghasilkan urutan "acak" dari sebuah angka awal. Angka awal itu disebut **seed**. Seed yang sama menghasilkan urutan yang sama, di perangkat apa pun.

## Apa yang masuk ke dalam kunci

Soal dibuat dari gabungan beberapa hal: mode kuis, cakupan (juz, surah, atau rentang ayat), tingkat kesulitan, dan seed. Hasilnya, kuis dengan pengaturan dan seed yang sama selalu identik. Jumlah soal tidak ikut dihitung, jadi kuis 5 soal adalah awal dari kuis 10 soal yang sama.

## Di mana seed disimpan

- **Tautan guru**: seed ada di dalam tautan itu sendiri. Siapa pun yang membuka tautan memakai seed yang sama.
- **Tantangan Harian**: seed berasal dari tanggal di zona waktu Jakarta, jadi semua orang pada hari yang sama mendapat soal yang sama.

## Kenapa tanpa server itu penting

- **Privasi**: tidak ada daftar murid atau soal yang tersimpan di server.
- **Cepat dan murah**: seluruh logika berjalan di perangkatmu, jadi situs bisa dipakai [tanpa internet](/blog/hafalan-quran-offline) setelah dimuat.
- **Tahan lama**: tautan lama tetap berlaku selama aturan pembuatan soal tidak berubah, dan kami menjaga aturan itu agar tautan yang sudah dibagikan tidak rusak.

Penjelasan penggunaannya ada di [cara membuat kuis untuk murid](/blog/cara-membuat-kuis-hafalan-untuk-murid) dan [Tantangan Harian](/blog/tantangan-harian-sambung-ayat).
