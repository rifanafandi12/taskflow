# TaskFlow - Aplikasi Manajemen Tugas

TaskFlow adalah prototipe aplikasi web dinamis untuk manajemen tugas (task manager) yang dibangun untuk memenuhi Tugas Pemantapan 1 mata kuliah Pemrograman Berbasis Platform. Aplikasi ini memungkinkan pengguna untuk mencatat, mengelola, dan memantau status pekerjaan (To Do, In Progress, Done) secara real-time.

## Fitur Utama

- Operasi CRUD lengkap (Create, Read, Update, Delete) melalui REST API.
- Pencarian tugas berdasarkan kata kunci (judul atau deskripsi).
- Strategi pengelolaan data menggunakan Load More.
- Notifikasi real-time menggunakan WebSocket (Socket.io) saat data ditambahkan, diubah, atau dihapus.
- Halaman dashboard yang dirender di sisi server menggunakan View Engine EJS.
- Desain responsif yang diuji pada breakpoint 375px (Smartphone), 768px (Tablet), dan 1440px (Desktop).
- Antarmuka pengguna modern dengan animasi gradient mesh, skeleton loading, dan toast notification.

## Teknologi yang Digunakan

| Kategori | Teknologi |
|----------|-----------|
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2) |
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| View Engine | EJS |
| Real-time | Socket.io |
| Validasi | Zod |

## Prasyarat

Sebelum menjalankan aplikasi, pastikan perangkat Anda sudah terpasang:

1. Node.js (versi 18 atau lebih baru).
2. MySQL Server (bisa menggunakan XAMPP, Laragon, atau instalasi mandiri).

## Cara Instalasi

1. Clone repository ini atau ekstrak file proyek ke direktori lokal Anda.
git clone https://github.com/rifanafandi12/taskflow.git
cd taskflow


2. Install seluruh dependensi yang dibutuhkan.
npm install


3. Buat database MySQL baru dengan nama `taskflow`.
CREATE DATABASE taskflow;


4. Import skema tabel ke dalam database tersebut.
USE taskflow;

CREATE TABLE tasks (
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(255) NOT NULL,
description TEXT,
status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


5. Buat file `.env` di root folder proyek, lalu isi dengan konfigurasi berikut sesuai pengaturan MySQL Anda.
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskflow
PORT=3000


6. Jalankan aplikasi.
npm run dev


Atau jika ingin menjalankan tanpa nodemon:
npm start


7. Buka browser dan akses aplikasi melalui:

- Halaman utama (client-side): http://localhost:3000
- Halaman dashboard (server-side): http://localhost:3000/dashboard

## Struktur Proyek
```javascript
taskflow/
├── server/
│ ├── index.js # Entry point Express + Socket.io
│ ├── db.js # Koneksi database MySQL
│ ├── routes/
│ │ ├── tasks.js # REST API CRUD
│ │ └── pages.js # Route untuk SSR (EJS)
│ └── views/
│ └── dashboard.ejs # Halaman dashboard (SSR)
├── public/
│ ├── index.html # Halaman utama (client-side)
│ ├── css/
│ │ └── style.css # Styling dan animasi
│ └── js/
│ └── app.js # Logika JavaScript sisi klien
├── .env # Konfigurasi environment (tidak di-commit)
├── .gitignore
├── package.json
└── README.md

```

## Endpoint REST API

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/tasks` | Menampilkan seluruh data (mendukung query `?q=` untuk pencarian) |
| GET | `/api/tasks/:id` | Menampilkan detail data berdasarkan ID |
| POST | `/api/tasks` | Menambahkan data baru |
| PUT | `/api/tasks/:id` | Memperbarui data berdasarkan ID |
| DELETE | `/api/tasks/:id` | Menghapus data berdasarkan ID |

## Catatan Penggunaan

- Pastikan MySQL Server dalam keadaan berjalan sebelum menjalankan aplikasi.
- File `.env` tidak boleh di-commit ke repository publik karena berisi kredensial database.
- Folder `node_modules` tidak perlu di-commit atau dikumpulkan.
- Untuk menguji fitur real-time, buka aplikasi pada dua tab browser yang berbeda, lalu tambahkan tugas di salah satu tab. Tab lainnya akan menerima notifikasi dan pembaruan data secara otomatis.

## Pengembang

Tugas Pemantapan 1 - Mata Kuliah Pemrograman Berbasis Platform