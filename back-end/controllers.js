const db = require('./db/dbconnect');        
const path = require('path');
const fs = require('fs').promises;

class Post {
    constructor(title, body, category_name, subcategory_name, variance_name, images) {
        this.title = title;
        this.body = body;
        this.category_name = category_name;
        this.subcategory_name = subcategory_name;
        this.variance_name = variance_name;
        this.images = images; // Array of image objects from multer (with filenames already set by middleware)
    }
// saving post to categories
    async save() {
        const imagesJson = JSON.stringify(this.images)
        try {
            this.subcategory_name = this.subcategory_name === undefined ? null : this.subcategory_name;
            this.variance_name = this.variance_name === undefined ? null : this.variance_name;
            
            const { category_id, subcategory_id, variance_id } = await Post._getCategoryIds(
                this.category_name,
                this.subcategory_name || null,
                this.variance_name || null
            );
            console.log('category_id:', category_id);
            console.log('subcategory_id:', subcategory_id);
            console.log('variance_id:', variance_id);
            console.log('imagesJson:', imagesJson);

            // Convert image filenames to JSON string (assuming filenames are already set by the middleware)
            // const imagesJson = JSON.stringify(this.images)
            const sql = `
                INSERT INTO posts (title, body, category_id,subcategory_id,variance_id, images, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            const [result] = await db.execute(sql, [
                this.title,
                this.body,
                category_id,
                subcategory_id || null,
                variance_id || null,
                imagesJson || null
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error saving post:', error);
            throw error;
        }
    }
// matching the category name to its id's
    static async _getCategoryIds(category_name, subcategory_name, variance_name) {

        subcategory_name = subcategory_name === undefined ? null : subcategory_name;
    variance_name = variance_name === undefined ? null : variance_name;

        const sql = `
            SELECT c.id AS category_id, sc.id AS subcategory_id, v.id AS variance_id
            FROM categories c
            LEFT JOIN categories sc ON sc.parent_id = c.id AND sc.name = ?
            LEFT JOIN categories v ON v.parent_id = sc.id AND v.name = ?
            WHERE c.name = ? AND c.parent_id IS NULL
        `;
        const [rows] = await db.execute(sql, [subcategory_name || null, variance_name || null, category_name]);

        if (rows.length === 0 || !rows[0].category_id) {
            throw new Error('Invalid category, subcategory, or variance name provided');
        }

        return {
            category_id: rows[0].category_id || null,
            subcategory_id: rows[0].subcategory_id || null,
            variance_id: rows[0].variance_id || null,
        };
    }  

    // static async _getCategoryIds(category_name, subcategory_name = null, variance_name = null ) {
    //     let sql = `SELECT id FROM categories WHERE name = ?`;
    //     let params = [category_name];

    //     if (subcategory_name) {
    //         sql += ` OR name = ?`;
    //         params.push(subcategory_name);
    //     }

    //     if (variance_name) {
    //         sql += ` OR name = ?`;
    //         params.push(variance_name);
    //     }

    //     const [categoryRows] = await db.execute(sql, params);

    //     const categoryMap = {};
    //     categoryRows.forEach(row => {
    //         if (category_name === row.name) {
    //             categoryMap['category_id'] = row.id;
    //         } else if (subcategory_name === row.name) {
    //             categoryMap['subcategory_id'] = row.id;
    //         } else if (variance_name === row.name) {
    //             categoryMap['variance_id'] = row.id;
    //         }
    //     });

    //     return categoryMap;
    // }

    // static async _getCategoryIds(category_name) {
    //     const sql = `
    //         SELECT id AS category_id
    //         FROM categories
    //         WHERE name = ?
    //     `;
    //     const [rows] = await db.execute(sql, [category_name]);
    
    //     if (rows.length === 0 || !rows[0].category_id) {
    //         throw new Error('Invalid category name provided');
    //     }
    
    //     return { category_id: rows[0].category_id };
    // }
    

    // find all post
    static async findAll() {
        const sql = `
             SELECT p.*, c.name AS category_name, sc.name AS subcategory_name, v.name AS variance_name
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN categories sc ON c.parent_id = sc.id
             LEFT JOIN categories v ON sc.parent_id = v.parent_id
         `;
    //     const sql = `
    //     SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
    //     FROM posts p
    //     JOIN categories c ON p.category_id = c.id
    //     LEFT JOIN categories sc ON c.parent_id = sc.id
    //     LEFT JOIN categories v ON sc.id = v.parent_id
    //     WHERE p.id = ?
    // `;
        

        const [posts] = await db.execute(sql);

        return posts.map(post => ({
            ...post,
            images: JSON.parse(post.images) // Convert images JSON string back to array
        }));
    }
// find post by id
    static async findById(id) {
        const sql = `
            SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
             FROM posts p
             JOIN categories c ON p.category_id = c.id
             LEFT JOIN categories sc ON c.parent_id = sc.id
             LEFT JOIN categories v ON sc.id = v.parent_id
             WHERE p.id = ?
         `;
        // console.log(id)
        // const sql = `
        //     SELECT p.*, c.name AS category_name, sc.name AS subcategory_name, v.name AS variance_name
        //     FROM posts p
        //     JOIN categories v ON p.variance_id = v.id
        //     JOIN categories sc ON v.parent_id = sc.id
        //     JOIN categories c ON sc.parent_id = c.id
        //     WHERE p.id = ?
        // `;   

        
        // SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
        // FROM posts p
        // JOIN categories c ON p.category_id = c.id
        // LEFT JOIN categories sc ON c.parent_id = sc.id
        // LEFT JOIN categories v ON sc.id = v.parent_id
        // WHERE p.id = ? 
        const [posts] = await db.execute(sql, [id]);
        // console.log["posts result:",posts]

        if (posts.length > 0) {
            const post = posts[0];
            post.images = JSON.parse(post.images); // Convert images JSON string back to array
            // console.log("post found:",post);
            return post;
        }
        return null;
    }
// update post
    static async update(id, newData) {
        const imagesJson = JSON.stringify(newData.images);
        try {
             const { category_id,subcategory_id,variance_id } = await Post._getCategoryIds(
                newData.category_name || null,
                 newData.subcategory_name || null,
                 newData.variance_name || null
            );

            // Convert image filenames to JSON string (assuming filenames are already set by the middleware)
            // const imagesJson = JSON.stringify(newData.images.map(image => image.filename));
            // const imagesJson = JSON.stringify(newData.images);

            const sql = `
                UPDATE posts
                SET title = ?, body = ?, category_id = ?, subcategory_id = ?,variance_id = ?,images = ?
                WHERE id = ?
            `;
            await db.execute(sql, [
                newData.title,
                newData.body,
                category_id || null,
                subcategory_id || null,
                variance_id || null,
                imagesJson || null,
                id,
            ]);
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    }
// delete post by id
    static async delete(id) {
        try {
            // Fetch the post to get image filenames
            const post = await this.findById(id);
            if (post && post.images) {
                // Delete associated image files
                for (const filename of post.images) {
                    const filepath = path.join(__dirname, 'back-end/pictures', filename);
                    await fs.unlink(filepath).catch(console.error);
                }
            }

            const sql = `DELETE FROM posts WHERE id = ?`;
            await db.execute(sql, [id]);
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }
    
    // selct post by category names
    // static async findByCategoryName(category_name) {
    //     try {
    //         // Fetch the category ID based on the category name
    //         const sqlCategory = `SELECT id FROM categories WHERE name = ? AND parent_id IS NULL`;
    //         const [categoryRows] = await db.execute(sqlCategory, [category_name]);

    //         if (categoryRows.length === 0) {
    //             throw new Error('Category not found');
    //         }

    //         const categoryId = categoryRows[0].id;

    //         // Fetch the IDs of all subcategories under the selected category
    //         const sqlSubcategories = `SELECT id FROM categories WHERE parent_id = ?`;
    //         const [subcategoryRows] = await db.execute(sqlSubcategories, [categoryId]);

    //         const subcategoryIds = subcategoryRows.map(row => row.id);

    //         // Fetch all posts under the category and its subcategories
    //         const sqlPosts = `
    //             SELECT p.*, c.name AS category_name, sc.name AS subcategory_name, v.name AS variance_name
    //             FROM posts p
    //             LEFT JOIN categories v ON p.variance_id = v.id
    //             LEFT JOIN categories sc ON p.subcategory_id = sc.id
    //             LEFT JOIN categories c ON p.category_id = c.id
    //             WHERE p.category_id = ? OR p.subcategory_id IN (?)
    //         `;

    //         const [posts] = await db.execute(sqlPosts, [categoryId, subcategoryIds]);

    //         return posts.map(post => ({
    //             ...post,
    //             images: JSON.parse(post.images) // Convert images JSON string back to array
    //         }));
    //     } catch (error) {
    //         console.error('Error fetching posts by category:', error);
    //         throw error;
    //     }
    // }

    static async getPostsByCategory(category_name) {
        const sql = `
            WITH RECURSIVE CategoryTree AS (
                SELECT id, name, parent_id
                FROM categories
                WHERE name = ?

                UNION ALL

                SELECT c.id, c.name, c.parent_id
                FROM categories c
                INNER JOIN CategoryTree ct ON c.parent_id = ct.id
            )
            SELECT p.*, ct.name AS category_name
            FROM posts p
            JOIN CategoryTree ct
            ON p.category_id = ct.id 
            OR p.subcategory_id = ct.id 
            OR p.variance_id = ct.id
        `;
        const [posts] = await db.execute(sql, [category_name]);
        return posts;
    }

}

module.exports = Post;


