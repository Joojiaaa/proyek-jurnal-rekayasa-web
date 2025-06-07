const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Ganti sesuai nama file controller yang benar
const authorController = require('../controllers/author.controllers');

// Setup multer untuk upload foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Endpoint API
router.get('/', authorController.getAllAuthors);
router.post('/', upload.single('photo'), authorController.createAuthor);
router.put('/:id', authorController.updateAuthor);
router.delete('/:id', authorController.deleteAuthor);

module.exports = router;