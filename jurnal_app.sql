-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 18, 2025 at 05:24 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jurnal_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `review` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `articles`
--

INSERT INTO `articles` (`id`, `title`, `content`, `author_id`, `created_at`, `updated_at`, `status`, `review`) VALUES
(1, 'Mengenal Machine Learning', 'Machine Learning adalah cabang dari AI yang memungkinkan komputer belajar dari data...', 101, '2024-12-01 10:15:00', '2024-12-01 10:15:00', 'pending', NULL),
(2, 'Tips Produktivitas di Era Digital', 'Di zaman serba digital, kita perlu mengatur waktu dan teknologi agar tetap produktif...', 102, '2025-01-20 08:30:00', '2025-01-21 09:00:00', 'pending', NULL),
(3, 'Sejarah Singkat Internet', 'Internet bermula dari proyek ARPANET di Amerika Serikat pada akhir 1960-an...', 103, '2025-03-02 12:00:00', '2025-03-05 14:45:00', 'pending', NULL),
(4, 'Panduan Dasar Investasi Saham', 'Investasi saham bisa dimulai dengan memahami fundamental dan analisis teknikal...', 101, '2025-04-10 15:20:00', '2025-04-11 10:10:00', 'pending', NULL),
(5, 'Cara Membuat Aplikasi Web Sederhana', 'Langkah awal membuat aplikasi web adalah menentukan teknologi stack yang digunakan...', 104, '2025-05-01 09:45:00', '2025-05-02 11:00:00', 'pending', NULL),
(6, 'Manfaat Belajar Pemrograman di Usia Muda', 'Belajar pemrograman sejak dini dapat meningkatkan kemampuan problem solving, kreativitas, dan logika berpikir anak-anak dalam menghadapi tantangan dunia digital.', 105, '2025-05-10 14:25:00', '2025-05-10 14:25:00', 'pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journals`
--

CREATE TABLE `journals` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `abstract` text DEFAULT NULL,
  `authors` varchar(255) DEFAULT NULL,
  `publication_date` date DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `doi` varchar(255) DEFAULT NULL,
  `keywords` varchar(255) DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `journals`
--

INSERT INTO `journals` (`id`, `title`, `abstract`, `authors`, `publication_date`, `publisher`, `doi`, `keywords`, `file_url`) VALUES
(1, 'Pemanfaatan AI dalam Pendidikan', 'Studi ini membahas penerapan AI dalam dunia pendidikan.', 'Budi Santoso, Rina Andini', '2023-05-15', 'Universitas Teknologi', '10.1234/ai-pendidikan', 'AI, Pendidikan, Teknologi', 'https://contoh.com/file1.pdf'),
(2, 'Analisis Big Data untuk Bisnis', 'Penelitian ini mengkaji penggunaan big data dalam pengambilan keputusan bisnis.', 'Dewi Lestari', '2022-11-10', 'Institut Bisnis Nasional', '10.1234/bigdata-bisnis', 'Big Data, Bisnis, Analisis', 'https://contoh.com/file2.pdf'),
(3, 'Blockchain dalam Sistem Kesehatan', 'Artikel ini mengeksplorasi manfaat blockchain dalam sistem informasi kesehatan.', 'Andi Pratama', '2023-01-20', 'Pusat Riset Teknologi', '10.1234/blockchain-kesehatan', 'Blockchain, Kesehatan, Teknologi', 'https://contoh.com/file3.pdf'),
(4, 'Sistem perangkuman otomatis berbasis NLP dan Deep Learning', 'Perkembangan teknologi kecerdasan buatan, khususnya dalam bidang pemrosesan bahasa alami (Natural Language Processing), telah memungkinkan pengembangan sistem perangkuman otomatis yang semakin efektif. Sistem ini digunakan untuk mengekstrak atau menyusun kembali informasi penting dari dokumen panjang secara cepat dan akurat.', 'Jian A.Jenistiani', '2025-05-09', 'jian', '10.1234/ml-teknologi', 'perangkuman otomatis, NLP, Deep learning', 'https://www.datailmu.com/artikel/pemahaman-information-retrieval-2025');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `journal_id` int(11) NOT NULL,
  `reviewer_id` int(11) NOT NULL,
  `comments` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','reviewer','author') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(12, 'admin', 'admin@xample.com', '$2b$10$HnC67dm6k0UiM2QjE0jXkOwD3QC4fHEU.l9ik6CNyo2dEom5yx/AC', 'admin', '2025-05-12 05:23:04', '2025-05-12 05:23:04'),
(101, 'Andi Saputra', 'andi@example.com', '', 'author', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(102, 'Budi Santoso', 'budi@example.com', '', 'author', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(103, 'Citra Lestari', 'citra@example.com', '', 'author', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(104, 'Dedi Pratama', 'dedi@example.com', '', 'author', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(105, 'author', 'author@xample.com', '$2b$10$gdp1.pezQryGXiAkh473I.qVNJuC73QkeGzgjM58i3Wf.IEDlVehi', 'author', '2025-05-15 05:21:25', '2025-05-15 05:21:25'),
(106, 'reviewer', 'reviewer@xample.com', '$2b$10$D8O54PbqkKNZ8VK8k6Smjuf2Cq6es3tfNk.GCmyfl3AmA3dgwsIWa', 'reviewer', '2025-05-15 06:00:54', '2025-05-15 06:00:54');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `journals`
--
ALTER TABLE `journals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_id` (`journal_id`),
  ADD KEY `reviewer_id` (`reviewer_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `email_21` (`email`),
  ADD UNIQUE KEY `email_22` (`email`),
  ADD UNIQUE KEY `email_23` (`email`),
  ADD UNIQUE KEY `email_24` (`email`),
  ADD UNIQUE KEY `email_25` (`email`),
  ADD UNIQUE KEY `email_26` (`email`),
  ADD UNIQUE KEY `email_27` (`email`),
  ADD UNIQUE KEY `email_28` (`email`),
  ADD UNIQUE KEY `email_29` (`email`),
  ADD UNIQUE KEY `email_30` (`email`),
  ADD UNIQUE KEY `email_31` (`email`),
  ADD UNIQUE KEY `email_32` (`email`),
  ADD UNIQUE KEY `email_33` (`email`),
  ADD UNIQUE KEY `email_34` (`email`),
  ADD UNIQUE KEY `email_35` (`email`),
  ADD UNIQUE KEY `email_36` (`email`),
  ADD UNIQUE KEY `email_37` (`email`),
  ADD UNIQUE KEY `email_38` (`email`),
  ADD UNIQUE KEY `email_39` (`email`),
  ADD UNIQUE KEY `email_40` (`email`),
  ADD UNIQUE KEY `email_41` (`email`),
  ADD UNIQUE KEY `email_42` (`email`),
  ADD UNIQUE KEY `email_43` (`email`),
  ADD UNIQUE KEY `email_44` (`email`),
  ADD UNIQUE KEY `email_45` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journals`
--
ALTER TABLE `journals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `articles`
--
ALTER TABLE `articles`
  ADD CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`journal_id`) REFERENCES `journals` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
