const Author = require('../models/author.model');
const path = require('path');

// Create author
const createAuthor = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const photo = req.file ? req.file.filename : null;

    const author = await Author.create({
      name,
      bio,
      photo
    });

    res.status(201).json(author);
  } catch (error) {
    console.error('❌ Gagal tambah author:', error);
    res.status(500).json({ error: 'Gagal menambahkan author' });
  }
};

// Get all authors
const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.findAll();
    res.json(authors);
  } catch (error) {
    console.error('❌ Gagal ambil author:', error);
    res.status(500).json({ error: 'Gagal mengambil data author' });
  }
};

// Update author
const updateAuthor = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, bio } = req.body;
    const photo = req.file ? req.file.filename : null;

    const author = await Author.findByPk(id);
    if (!author) {
      return res.status(404).json({ error: 'Author tidak ditemukan' });
    }

    author.name = name || author.name;
    author.bio = bio || author.bio;
    if (photo) author.photo = photo;

    await author.save();

    res.json(author);
  } catch (error) {
    console.error('❌ Gagal update author:', error);
    res.status(500).json({ error: 'Gagal mengupdate author' });
  }
};

// Delete author
const deleteAuthor = async (req, res) => {
  try {
    const id = req.params.id;
    const author = await Author.findByPk(id);
    if (!author) {
      return res.status(404).json({ error: 'Author tidak ditemukan' });
    }

    await author.destroy();

    res.json({ message: 'Author berhasil dihapus' });
  } catch (error) {
    console.error('❌ Gagal hapus author:', error);
    res.status(500).json({ error: 'Gagal menghapus author' });
  }
};

module.exports = {
  createAuthor,
  getAllAuthors,
  updateAuthor,
  deleteAuthor
};
