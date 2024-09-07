const db = require('./db/dbconnect');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.memoryStorage(); // Use memory storage for processing

const upload = multer({ storage: storage }); // Store files in memory for processing

const imageSizeMiddleware = async (req, res, next) => {
    if (!req.files || !req.files.length) {
        return next(); // Proceed if no files are provided
    } 

    let sql = "SELECT * from size"
    let [result] = await db.query(sql); 

    const user = result[0]

    const maxWidth = user.width; // Set your maximum width
    const maxHeight = user.height; // Set your maximum height  



    try {
        // Process each file with Sharp
        await Promise.all(req.files.map(async (file) => {
            const image = sharp(file.buffer);
            const metadata = await image.metadata();

            if (metadata.width > maxWidth || metadata.height > maxHeight) {
                // Resize the image if it exceeds max dimensions
                const resizedImage = await image
                    .resize({ width: maxWidth, height: maxHeight, fit: 'fill' })
                    .toBuffer();

                file.buffer = resizedImage; // Replace the file buffer with resized image
            }

            // Generate a unique filename
            const filename = Date.now() + path.extname(file.originalname);
            const destinationDir = path.join(__dirname,'/pictures');
            const destination = path.join(destinationDir,filename);

            // Save the resized image to disk
            await fs.writeFile(destination, file.buffer);

            // Replace the file path with the saved path
            file.path = destination;
            file.filename = filename;
        }));

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        next(error); // Pass error to the Express error handler
    }
};

module.exports = { upload, imageSizeMiddleware };
