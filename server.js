require('dotenv').config(); // tambahkan ini
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');

const sequelize = require('./config/db');
const User = require('./models/user.model');
const Journal = require('./models/journal.model');
const Article = require('./models/article.model');
const Author = require('./models/author.model');
const authorRoutes = require('./routes/author.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/api/authors', authorRoutes);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));


// Multer for file uploads (specifically for photos)
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Generates a unique filename using timestamp and random number
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Appends the original file extension to the unique filename
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// =================== DATABASE SYNC ===================
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi ke database berhasil');
    
    // Sinkronisasi semua model tanpa menghancurkan tabel
    await sequelize.sync({ force: false });
    console.log('✅ Model berhasil disinkronkan');
    
  } catch (error) {
    console.error('❌ Gagal koneksi:', error);
  }
})();


// =================== AUTHENTICATION ROUTES ===================

// Route for user registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // Validate if all required fields are provided
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Semua field wajib diisi' }); // All fields are required
    }

    // Check if a user with the given email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' }); // Email already registered
    }

    // Hash the user's password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user record
    const user = await User.create({ name, email, password: hashedPassword, role });

    // Destructure to exclude the password from the response
    const { password: _, ...userData } = user.dataValues;
    res.status(201).json(userData); // Respond with created user data (excluding password)
  } catch (err) {
    res.status(500).json({ error: 'Gagal mendaftar', detail: err.message }); // Registration failed
  }
});

// Route for user login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find the user by email
    const user = await User.findOne({ where: { email } });

    // Check if user exists and if the provided password matches the hashed password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Email atau password salah' }); // Incorrect email or password
    }

    // Store user ID and email in the session
    req.session.userId = user.id;
    req.session.email = user.email;

    // Destructure to exclude the password from the response
    const { password: _, ...userData } = user.dataValues;
    res.status(200).json({ message: 'Login berhasil', user: userData }); // Login successful
  } catch (err) {
    res.status(500).json({ error: 'Gagal login', detail: err.message }); // Login failed
  }
});

// Route for user logout
app.post('/api/logout', (req, res) => {
  // Destroy the user session
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Gagal logout' }); // Logout failed
    // Clear the session cookie
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout berhasil' }); // Logout successful
  });
});

// Route to get current logged-in user's data
app.get('/api/me', async (req, res) => {
  // Check if user is logged in (session userId exists)
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login terlebih dahulu' }); // Must be logged in

  try {
    // Find user by ID from session
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' }); // User not found

    // Destructure to exclude the password from the response
    const { password, ...userData } = user.dataValues;
    res.status(200).json(userData); // Respond with user data
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengguna', detail: err.message }); // Failed to retrieve user data
  }
});

// =================== USER MANAGEMENT (ADMIN ONLY) ===================

// Route to get all users (Admin only)
app.get('/api/users', async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' }); // Must be logged in

  // Check if the logged-in user is an admin
  const user = await User.findByPk(req.session.userId);
  if (user.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh' }); // Only admin is allowed

  try {
    // Find all users, excluding their passwords
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(users); // Respond with list of users
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar pengguna', detail: err.message }); // Failed to retrieve user list
  }
});

// Route to update a user by ID (Admin only)
app.put('/api/users/:id', async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' }); // Must be logged in

  // Check if the logged-in user is an admin
  const admin = await User.findByPk(req.session.userId);
  if (admin.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh' }); // Only admin is allowed

  const { name, role } = req.body;
  // Validate if name and role are provided
  if (!name || !role) return res.status(400).json({ error: 'Nama dan role wajib diisi' }); // Name and role are required

  try {
    // Update user record by ID
    const [updated] = await User.update({ name, role }, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'User tidak ditemukan' }); // User not found

    // Retrieve the updated user data (excluding password)
    const updatedUser = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json(updatedUser); // Respond with updated user data
  } catch (err) {
    res.status(500).json({ error: 'Gagal update user', detail: err.message }); // Failed to update user
  }
});

// Route to delete a user by ID (Admin only)
app.delete('/api/users/:id', async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' }); // Must be logged in

  // Check if the logged-in user is an admin
  const admin = await User.findByPk(req.session.userId);
  if (admin.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh' }); // Only admin is allowed

  // Prevent admin from deleting their own account
  if (parseInt(req.params.id) === admin.id) {
    return res.status(400).json({ error: 'Tidak boleh hapus diri sendiri' }); // Cannot delete self
  }

  try {
    // Delete user record by ID
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'User tidak ditemukan' }); // User not found

    res.status(200).json({ message: 'User berhasil dihapus' }); // User deleted successfully
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus user', detail: err.message }); // Failed to delete user
  }
});

// =================== JOURNAL ROUTES ===================

// Route to get all journals
app.get('/api/journals', async (req, res) => {
  try {
    const journals = await Journal.findAll(); // Find all journal records
    res.status(200).json(journals); // Respond with list of journals
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data jurnal' }); // Failed to retrieve journal data
  }
});

// Route to get a single journal by ID
app.get('/api/journals/:id', async (req, res) => {
  try {
    const journal = await Journal.findByPk(req.params.id); // Find journal by ID
    if (journal) {
      res.status(200).json(journal); // Respond with journal data if found
    } else {
      res.status(404).json({ error: 'Jurnal tidak ditemukan' }); // Journal not found
    }
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data jurnal', detail: err.message }); // Failed to retrieve journal data
  }
});

// This is a duplicate route for '/api/journals'. It can be removed if not intentionally different.
// Keeping it here for now as it was in the original code.
app.get('/api/journals', async (req, res) => {
  try {
    const journals = await Journal.findAll();
    res.status(200).json(journals);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data jurnal' });
  }
});


// Route to create a new journal
app.post('/api/journals', async (req, res) => {
  try {
    const journal = await Journal.create(req.body); // Create new journal record
    res.status(201).json(journal); // Respond with created journal
  } catch (err) {
    res.status(400).json({ error: 'Gagal menambahkan jurnal', detail: err.message }); // Failed to add journal
  }
});

// Route to update a journal by ID
app.put('/api/journals/:id', async (req, res) => {
  try {
    // Update journal record by ID
    const [updated] = await Journal.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedJournal = await Journal.findByPk(req.params.id); // Retrieve updated journal
      res.status(200).json(updatedJournal); // Respond with updated journal
    } else {
      res.status(404).json({ error: 'Jurnal tidak ditemukan' }); // Journal not found
    }
  } catch (err) {
    res.status(400).json({ error: 'Gagal mengupdate jurnal', detail: err.message }); // Failed to update journal
  }
});

// Route to delete a journal by ID
app.delete('/api/journals/:id', async (req, res) => {
  try {
    // Delete journal record by ID
    const deleted = await Journal.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send(); // Respond with no content if deleted successfully
    } else {
      res.status(404).json({ error: 'Jurnal tidak ditemukan' }); // Journal not found
    }
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus jurnal' }); // Failed to delete journal
  }
});

// =================== ARTICLE ROUTES ===================

// Route to get articles (filtered by author if user is an author)
app.get('/api/articles', async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' }); // Must be logged in

  try {
    const user = await User.findByPk(req.session.userId); // Find logged-in user
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' }); // User not found

    let articles;
    // If user is an author, retrieve only their articles
    if (user.role === 'author') {
      articles = await Article.findAll({ where: { authorId: user.id } });
    } else {
      // Otherwise (admin/reviewer), retrieve all articles
      articles = await Article.findAll();
    }

    res.status(200).json(articles); // Respond with list of articles
  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil artikel', detail: err.message }); // Failed to retrieve articles
  }
});

// Route to create a new article
app.post('/api/articles', async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' }); // Must be logged in

  const { title, content } = req.body;
  // Validate if title and content are provided
  if (!title || !content) return res.status(400).json({ error: 'Field wajib diisi semua' }); // All fields are required

  try {
    // Create new article record, associating it with the logged-in author
    const article = await Article.create({ title, content, authorId: req.session.userId });
    res.status(201).json(article); // Respond with created article
  } catch (err) {
    res.status(500).json({ error: 'Gagal simpan artikel', detail: err.message }); // Failed to save article
  }
});

// Route to download an article as PDF
app.get('/api/articles/:id/download', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id); // Find article by ID
    if (!article) return res.status(404).json({ error: 'Artikel tidak ditemukan' }); // Article not found

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    // FIX: Corrected Content-Disposition header with template literal
    res.setHeader('Content-Disposition', `attachment; filename="article-${article.id}.pdf"`);

    // Create a new PDF document
    const doc = new PDFDocument();
    doc.pipe(res); // Pipe the PDF document to the response stream
    doc.fontSize(20).text(article.title, { underline: true }); // Add article title
    doc.moveDown(); // Move cursor down
    doc.fontSize(14).text(article.content); // Add article content
    doc.end(); // Finalize the PDF and end the stream
  } catch (error) {
    res.status(500).json({ error: 'Gagal generate PDF', detail: error.message }); // Failed to generate PDF
  }
});

// Route to review an article (Reviewer only)
app.put('/api/articles/:id/review', async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' }); // Must be logged in

  // Check if the logged-in user is a reviewer
  const reviewer = await User.findByPk(req.session.userId);
  if (reviewer.role !== 'reviewer') return res.status(403).json({ error: 'Akses ditolak' }); // Access denied

  const { status, review } = req.body; // Get status and review from request body

  try {
    // Update article status and review by ID
    const [updated] = await Article.update(
      { status, review },
      { where: { id: req.params.id } }
    );

    if (!updated) return res.status(404).json({ error: 'Artikel tidak ditemukan' }); // Article not found

    const updatedArticle = await Article.findByPk(req.params.id); // Retrieve updated article
    res.json(updatedArticle); // Respond with updated article data
  } catch (err) {
    res.status(500).json({ error: 'Gagal update artikel', detail: err.message }); // Failed to update article
  }
});

// =================== AUTHORS ROUTES ===================

// Route to get all authors
app.get('/api/authors', async (req, res) => {
  try {
    const authors = await Author.findAll(); // Find all author records
    res.status(200).json(authors); // Respond with list of authors
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data penulis' }); // Failed to retrieve author data
  }
});

// Route to create a new author with photo upload
app.post('/api/authors', upload.single('photo'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    // Get filename if photo was uploaded, otherwise null
    const photo = req.file ? req.file.filename : null;

    // Validate if author name is provided
    if (!name) return res.status(400).json({ error: 'Nama penulis wajib diisi' }); // Author name is required

    // Create new author record
    const author = await Author.create({ name, bio, photo });
    res.status(201).json(author); // Respond with created author
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan penulis', detail: err.message }); // Failed to save author
  }
});

// =================== SERVER START ===================
const PORT = process.env.PORT || 3000; // Define port, default to 3000
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`); // Log server start message
});