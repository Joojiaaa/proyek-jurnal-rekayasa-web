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
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));

// Multer untuk upload foto
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// =================== DATABASE SYNC ===================
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi ke database berhasil');
    await User.sync({ alter: true });
    await Journal.sync({ alter: true });
    await Article.sync({ alter: true });
    await Author.sync({ alter: true });
    console.log('✅ Model berhasil disinkronkan');
  } catch (error) {
    console.error('❌ Gagal koneksi:', error);
  }
})();

// =================== AUTH ===================
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    const { password: _, ...userData } = user.dataValues;
    res.status(201).json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mendaftar', detail: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    req.session.userId = user.id;
    req.session.email = user.email;

    const { password: _, ...userData } = user.dataValues;
    res.status(200).json({ message: 'Login berhasil', user: userData });
  } catch (err) {
    res.status(500).json({ error: 'Gagal login', detail: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Gagal logout' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout berhasil' });
  });
});

app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login terlebih dahulu' });

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    const { password, ...userData } = user.dataValues;
    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengguna', detail: err.message });
  }
});

// =================== USERS (ADMIN ONLY) ===================
app.get('/api/users', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' });

  const user = await User.findByPk(req.session.userId);
  if (user.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh' });

  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar pengguna', detail: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' });

  const admin = await User.findByPk(req.session.userId);
  if (admin.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh' });

  const { name, role } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Nama dan role wajib diisi' });

  try {
    const [updated] = await User.update({ name, role }, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'User tidak ditemukan' });

    const updatedUser = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update user', detail: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' });

  const admin = await User.findByPk(req.session.userId);
  if (admin.role !== 'admin') return res.status(403).json({ error: 'Hanya admin yang boleh' });

  if (parseInt(req.params.id) === admin.id) {
    return res.status(400).json({ error: 'Tidak boleh hapus diri sendiri' });
  }

  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'User tidak ditemukan' });

    res.status(200).json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus user', detail: err.message });
  }
});

// =================== JURNAL ===================
app.get('/api/journals', async (req, res) => {
  try {
    const journals = await Journal.findAll();
    res.status(200).json(journals);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data jurnal' });
  }
});

// Tambahkan endpoint ini untuk mengambil jurnal berdasarkan ID
app.get('/api/journals/:id', async (req, res) => {
  try {
    const journal = await Journal.findByPk(req.params.id);
    if (journal) {
      res.status(200).json(journal);
    } else {
      res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data jurnal', detail: err.message });
  }
});
app.get('/api/journals', async (req, res) => {
  try {
    const journals = await Journal.findAll();
    res.status(200).json(journals);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data jurnal' });
  }
});

app.post('/api/journals', async (req, res) => {
  try {
    const journal = await Journal.create(req.body);
    res.status(201).json(journal);
  } catch (err) {
    res.status(400).json({ error: 'Gagal menambahkan jurnal', detail: err.message });
  }
});

app.put('/api/journals/:id', async (req, res) => {
  try {
    const [updated] = await Journal.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedJournal = await Journal.findByPk(req.params.id);
      res.status(200).json(updatedJournal);
    } else {
      res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Gagal mengupdate jurnal', detail: err.message });
  }
});

app.delete('/api/journals/:id', async (req, res) => {
  try {
    const deleted = await Journal.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus jurnal' });
  }
});

// =================== ARTICLE ===================
app.get('/api/articles', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' });

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    let articles;
    if (user.role === 'author') {
      articles = await Article.findAll({ where: { authorId: user.id } });
    } else {
      articles = await Article.findAll();
    }

    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil artikel', detail: err.message });
  }
});

app.post('/api/articles', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' });

  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Field wajib diisi semua' });

  try {
    const article = await Article.create({ title, content, authorId: req.session.userId });
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: 'Gagal simpan artikel', detail: err.message });
  }
});

app.get('/api/articles/:id/download', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: 'Artikel tidak ditemukan' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="article-${article.id}.pdf"`);

    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(20).text(article.title, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(article.content);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Gagal generate PDF', detail: error.message });
  }
});

app.put('/api/articles/:id/review', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Harus login' });

  const reviewer = await User.findByPk(req.session.userId);
  if (reviewer.role !== 'reviewer') return res.status(403).json({ error: 'Akses ditolak' });

  const { status, review } = req.body;

  try {
    const [updated] = await Article.update(
      { status, review },
      { where: { id: req.params.id } }
    );

    if (!updated) return res.status(404).json({ error: 'Artikel tidak ditemukan' });

    const updatedArticle = await Article.findByPk(req.params.id);
    res.json(updatedArticle);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update artikel', detail: err.message });
  }
});

// =================== AUTHORS ===================
app.get('/api/authors', async (req, res) => {
  try {
    const authors = await Author.findAll();
    res.status(200).json(authors);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data penulis' });
  }
});

app.post('/api/authors', upload.single('photo'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!name) return res.status(400).json({ error: 'Nama penulis wajib diisi' });

    const author = await Author.create({ name, bio, photo });
    res.status(201).json(author);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan penulis', detail: err.message });
  }
});

// =================== START ===================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
