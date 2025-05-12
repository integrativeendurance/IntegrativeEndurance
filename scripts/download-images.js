const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    filename: 'mountain-loading.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&q=80',
    filename: 'mountain-landing.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    filename: 'mountain-signin.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&q=80',
    filename: 'mountain-signup.jpg'
  }
];

const assetsDir = path.join(__dirname, '..', 'assets', 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Download each image
images.forEach(image => {
  const filePath = path.join(assetsDir, image.filename);
  const file = fs.createWriteStream(filePath);

  https.get(image.url, response => {
    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${image.filename}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if there's an error
    console.error(`Error downloading ${image.filename}:`, err.message);
  });
}); 