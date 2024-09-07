const express = require("express");
const session = require('express-session');
const db = require('./db/dbconnect');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer= require('nodemailer');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser'); 
const crypto = require('crypto');
const { createtoken, validatetoken,createToken_1,validatetoken_1,createtoken_2,validatetoken_2,validateToken } = require('./jwt');
const app = express();
const Post = require('./controllers');
const { upload, imageSizeMiddleware } = require('./middleware');
const { urlToHttpOptions } = require("url");
const cors = require("cors");
const ejs = require('ejs');
const path = require('path');

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
app.use(bodyparser.urlencoded({ extended: true })); // Added body parser middleware for URL-encoded bodies
app.use(cookieParser()); 
app.use('/images', express.static(path.join(__dirname, 'pictures')));

app.set('views', __dirname); // Set the views directory to the root directory
app.set('view engine', 'ejs'); // Set the view engine to ejs
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure:true,
    auth: {
      user: 'madhavasrinivasan44@gmail.com',
      pass: 'nqzk euzg vbyg ggei'
    }
  }); 

// admin login route
app.post('/adminlogin',async(req,res) => {
  try{
    const{identifier,password} = req.body
        let sql = 'SELECT * FROM user_info WHERE username = ? OR email = ?'
        const  [users] =  await db.execute(sql,[identifier,identifier])
        console.log(users);
        const user = users[0];
        console.log(user)
        const dbpassword = user.password;
        const match = await bcrypt.compare(password, dbpassword); 
        console.log(match)
        console.log(dbpassword)
        console.log(password)

        if (!match) {
            return res.status(401).json("password incorrect"); 
        }
        const token_2 = createtoken_2(user);
        req.session.user = { username: user.username, id: user.id,role:user.role }; 
        req.session.token_2 = token_2;

        res.cookie("token_2", token_2, {
            maxAge: 6000000000, // Fixed maxAge property name
            httpOnly: true
        });

        res.cookie("logged_in", true, { // Fixed method and key name
            maxAge: 6000000000,
            httpOnly: false
        });

        res.status(200).json("login sucsessful");
  }catch(err){
    console.log(err)
    res.status(404).send("login failed")
  }


  }
)


// route for registration
app.post("/register", async (req, res) => { 
    try {
        const { username, password, email, name } = req.body;
        console.log(req.body);
        let sql_1 = 'SELECT * from user_info WHERE email = ?'
        const [existingUsers] = await db.execute(sql_1, [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
        const hash = await bcrypt.hash(password, 8);

        // verificationtoken for Email
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);


        let sql = 'INSERT INTO pending_users (username, password, email, name,verification_token,token_expiration) VALUES (?, ?, ?, ?, ?, ?)'; 
        const find = await db.execute(sql, [username, hash, email, name,verificationToken,tokenExpiration]);
        
        const verificationLink = `http://localhost:3000/verify/${verificationToken}`;

        // sending email to the user
        await transporter.sendMail({
            from: 'madhavasrinivasan44@gmail.com',
            to: email,
            subject: 'Email Verification',
            html: `Please click this link to verify your email: <a href="${verificationLink}"><stong>click here to verify</strong></a>`
          });
          res.status(201).json({ message: 'User registered. Please check your email to verify your account.' });
        
    } catch (error) {
        console.log(error);
        res.status(500).json("error registering ");
    }
});  



// verifying route
app.get('/verify/:token', async (req, res) => {
    const { token } = req.params;
try{
    let sql = 'SELECT * FROM pending_users WHERE verification_token = ? AND token_expiration > NOW()'
    const [pendingUsers] =  await db.execute(sql,[token])

    if (pendingUsers.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired verification link' });
      }
    
      const user = pendingUsers[0];
    
      let sql_5 = 'SELECT * FROM settings WHERE `key` = "admin_approval_required"';
      const [settings] = await db.execute(sql_5);
      const adminApprovalRequired = settings[0].value === '0'; 

      if (adminApprovalRequired) {
    //     // Check if user has been approved by admin
    //     let sql_6 = 'SELECT * FROM admin_approvals WHERE email = ?';
    //     const [adminApprovals] = await db.execute(sql_6, [user.email]);
  
    //     if (adminApprovals.length === 0) {
    //       return res.status(403).json({ message: 'waiting for admin approval' });
    //     }
    //   } 

    let sql_4 = 'SELECT * FROM roles WHERE name = ?'
    const [role] = await db.execute(sql_4, ['user']);


    let sql_2 = 'INSERT INTO user_info (email,password,name,username,role_id,role) values (?,?,?,?,?,?)'
    const [insert] = await db.execute(sql_2,[user.email,user.password,user.name,user.username,role[0].id,'user']); 


    let sql_3 = 'DELETE FROM pending_users WHERE email = ?'
    const [delete_1] = await db.execute(sql_3,[user.email])



    res.redirect('/login');
    }
    else{
        let sql_7 = "UPDATE pending_users SET auth_id = 1 WHERE id = ?"
        const [insert_1] = await db.execute(sql_7,[user.id]); 
        res.render('verify.ejs');
    }
}
    catch(error){
        console.log(error);
        res.status(500).json("error verifying user");
}}) 



// route for login
app.post('/login', async (req, res) => { 
    try {
        const{identifier,password} = req.body
        let sql = 'SELECT * FROM user_info WHERE username = ? OR email = ?'
        const  [users] =  await db.execute(sql,[identifier,identifier])// Fixed HTTP status code
        console.log(users);
        const user = users[0];
        console.log(user)
        const dbpassword = user.password;
        const match = await bcrypt.compare(password, dbpassword); // Await bcrypt comparison
        if (!match) {
            return res.status(401).json("password incorrect"); // Fixed HTTP status code
        }
        
        // let sql_5 = "SELECT role_id FROM user_info  WHERE username = ? "
        // const [role] = await db.execute(sql_5,[user.username]);
    // if (role.id == 2) 
    let token;
        if (user.role_id === 2) {
            token = createtoken(user);
        } else if (user.role_id === 3) {
            token = createToken_1(user);
        } else {
            return res.status(403).json("Invalid role");
        }
        
        req.session.user = { username: user.username, id: user.id, role: user.role_id };
        req.session.token = token;
        
        res.cookie("token", token, {
            maxAge: 6000000000,
            httpOnly: true,
            secure: false,
            sameSite: 'strict'
        });
        
        res.cookie("logged_in", true, {
            maxAge: 6000000000,
            httpOnly: false,
            secure: false,
            sameSite: 'strict'
        });
        
        res.status(200).json({
            message: "Login successful",
            token: token,
            role: user.role_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json("Login failed");
    }
});
// app.get('/home', async (req, res) => {
//     try {
//       const results = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 4');
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error fetching latest posts' });
//     }
//   }); 

app.get('/home',validateToken,async (req, res) => {
    console.log('User in request:', req.user);
    try {
      const [results] = await db.execute('SELECT * FROM posts ORDER BY created_at DESC LIMIT 4');
  
      const posts = results.map(post => ({
        ...post,
        images: post.images ? JSON.parse(post.images.toString()) : [] // Convert buffer to string before parsing
      }));
  
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching latest posts' });
    }
  });

app.post("/adminDashbord",validatetoken_2,async(req,res) =>{
    try{
        let sql = 'SELECT * FROM user_info WHERE role = ?'
        const [result] = db.execute(sql,['admin']) 
        res.json(result)
    }catch(err){
      console.log(err)
      res.status(500).json({message:"Error fetching data"})
    }
})
  

// route for protected dashbord
app.get("/admin/approval",validatetoken_2,async(req, res) => {
    try {
        // let sql = 'SELECT * FROM settings WHERE key = "admin_approval_required"';
        // const [settings] = await db.execute(sql); 
        let sql = "SELECT * FROM pending_users WHERE auth_id = 1 "
        const [admin_aprovals] = await db.execute(sql);
    
        // const adminApprovalRequired = settings[0].value === '1';
    
        res.json({ admin_aprovals });
      } catch (error) {
        console.log(error);
        res.status(500).json("Error fetching admin approval setting");

      }
    }); 

app.post('/admin/dashbord/',validatetoken_2, async (req, res) => {
        try {
          const { enabled } = req.body;
      
          let sql = 'UPDATE settings SET value = ? WHERE `key` = "admin_approval_required"';
          await db.execute(sql, [enabled ? '1' : '0']);
      
          res.json({ message: 'Admin approval setting updated successfully' });
        } catch (error) {
          console.log(error);
          res.status(500).json("Error updating admin approval setting");
        }
      });

    // route to approve the user
    app.post('/admin/approve-user/:id', validatetoken_2,async (req, res) => {
        try {
          const { id } = req.params;
          console.log(id)
      
          // Check if user exists in pending_users table
          let sql = 'SELECT * FROM pending_users WHERE id = ?';
          const [pendingUsers] = await db.execute(sql, [id]);
      
          if (pendingUsers.length === 0) {
            return res.status(404).json({ message: 'User not found' });
          } 

          const user_1 = pendingUsers[0]
      
          // Approve user
        //   let sql_2 = 'INSERT INTO admin_approvals (email) VALUES (?)';
        //   await db.execute(sql_2, [email]);  

        //   let sql_5 = 'SELECT id FROM roles WHERE name = ?'
        //   const [role] = await db.execute(sql_5, ['user']);

        //   let sql_3 = 'INSERT INTO user_info (email, password, name, username,role,role_id) SELECT email, password, name, username FROM pending_users WHERE email = ?';
        //   await db.execute(sql_3, [email,user,role.id]); 

        let sql_5 = 'SELECT* FROM roles WHERE name = ?'
        const [role] = await db.execute(sql_5, ['user']);

        let sql_3 = 'INSERT INTO user_info (email,password,name,username,role_id,role) values (?,?,?,?,?,?)'
        const [insert] = await db.execute(sql_3,[user_1.email,user_1.password,user_1.name,user_1.username,role[0].id,"user"]); 
      
          // Delete user from pending_users table
          let sql_4 = 'DELETE FROM pending_users WHERE email = ?';
          await db.execute(sql_4, [user_1.email]);

          res.status(200).json("user approved")
        } catch(err){
            console.log(err);
            res.status(500).json("Error approving user");
        }})

        // route to change the user role
        app.post('/admin/change-role/:userId',validatetoken_2, async (req, res) => {
            try {
              const { userId } = req.params;
              const role = 'editor';
          
              
              let sql = 'SELECT role_id FROM user_info WHERE id = ?';
              const [currentUser] = await db.execute(sql, [userId]);
          
              
              if (currentUser.length === 0) {
                return res.status(404).json({ message: 'User not found' });
              }
          
              
              let sql_2 = 'SELECT id FROM roles WHERE name = ?';
              const [editorRole] = await db.execute(sql_2, [role]);
          
              
              let sql_3 = 'UPDATE user_info SET role_id = ?,role = ? WHERE id = ?';
              await db.execute(sql_3, [editorRole[0].id, role,userId]);
          
              res.json({ message: 'User role changed successfully' });
            } catch (error) {
              console.log(error);
              res.status(500).json({ message: 'Error changing user role' });
            }
          });

// logout route
app.get("/logout",(req,res) => {
    req.session.destroy((err) =>{
        if(err){
            res.redirect("/dashboard")
        }
        res.clearCookie("token");
        res.clearCookie("logged_in");
        res.redirect("/login");
    })
})

// forget password route
app.post("/forgetpassword",async (req,res) =>{
    const { email } = req.body;
    try{
    const sql = 'SELECT * FROM user_info where email = ?'
    const [select] = await db.execute(sql,[email]);

    if(select.length === 0){
        return res.status(404).json("sorry user not found");
    }
// setting rest token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date(Date.now() + 1 * 60 * 60 * 1000); 
    
    let sql_2 = 'UPDATE user_info SET reset_token = ?,reset_token_expiration = ? WHERE email = ?'
    const [update] = await db.execute(sql_2,[resetToken,tokenExpiration,email]);
let url="http://localhost:3000"
    const verificationLink =`${url}/reset-password/${resetToken}`;
// mail setup
    await transporter.sendMail({
        from: 'madhavasrinivasan44@gmail.com',
        to:email,
        subject: 'Password Reset Verification',
        html: `Please click this link to verify your password reset request: <a href='${verificationLink}'><strong>click here to reset the password</strong></a>`
      });
      res.json({ message: 'Password reset verification email sent' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error processing password reset request' });
    }}) 
 
// reset token route
app.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { newpassword, confirmpassword } = req.body;

    try {
        const sql = 'SELECT * FROM user_info WHERE reset_token = ? AND reset_token_expiration > NOW()';
        const [users] = await db.execute(sql, [token]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (newpassword !== confirmpassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const user = users[0];
        const hashedPassword = await bcrypt.hash(newpassword, 8);

        const sql_2 = 'UPDATE user_info SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?';
        await db.execute(sql_2, [hashedPassword, user.id]);

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error resetting password' });
    }
});


// Create a new post
app.post('/posts', upload.array('images'), imageSizeMiddleware,validatetoken_2, async (req, res) => {
    try {
        const { title, body, category_name, subcategory_name, variance_name } = req.body;
        const images_1 = req.files;

        // The filenames are set by the middleware
        // const images = req.files ? req.files.map(file => file.filename) : []; 
        const images = images_1.map((image) => image.filename);

        const post = new Post(title, body, category_name, subcategory_name || null, variance_name || null, images);
        const postId = await post.save();

        res.status(201).json({ message: 'Post created successfully', postId });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post' });
    }
});

// Get all posts
app.get('/posts',async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// Get post by ID
app.get('/posts/:id',validateToken,async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // console.log(req.params.id)
        if (post) {
            res.status(200).json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Error fetching post' });
    }
});
//  Update post
 
app.put('/posts/:id', upload.array('images'), imageSizeMiddleware, validateToken,async (req, res) => {
    if(req.user.role === "admin" || req.user.role === "editor"){
    try {
        const { title, body, category_name,subcategory_name,variance_name } = req.body;
        const images_1 = req.files || [];

        // The filenames are set by the middleware
        const images = images_1.map((image) => image.filename);

        const newData = { title, body, category_name , subcategory_name  , variance_name, images };
        await Post.update(req.params.id, newData);

        res.status(200).json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Error updating post' });
    }}
    else{
        res.status(403).json("acsses denied")
    }
});  

// Delete post
app.delete('/posts/:id', async (req, res) => {
    try {
        await Post.delete(req.params.id);
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post' });
    }
});  

// seacrch post by title for admin
app.get("/GetPost",async(req,res) => {
    try{
        const {tilte} = req.body
        let sql = "SELECT * FROM posts WHERE title = ?"
        let [result] = await db.execute(sql, [tilte])
        res.status(200).json(result)
    }catch(err){
        console.error(err)
        res.status(404).json("post not found")
    }
}) 





// getting post by subcategory name
app.get('/posts/category/:category_name',validateToken, async (req, res) => {
    try {
        const category_name = req.params.category_name;
        const posts = await Post.getPostsByCategory(category_name);
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// addind categories
app.post('/categories',validatetoken_2,async (req, res) => {
    const { name, parent_name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        // If parent_name is provided, we're adding a subcategory or variance
        let parentId = null;
        if (parent_name) {
            // Find the parent category ID
            const sqlParent = `SELECT id FROM categories WHERE name = ?`;
            const [parentRows] = await db.execute(sqlParent, [parent_name]);

            if (parentRows.length === 0) {
                return res.status(400).json({ message: 'Parent category not found' });
            }

            parentId = parentRows[0].id;
        }

        // Insert the new category, subcategory, or variance
        const sqlInsert = `INSERT INTO categories (name, parent_id) VALUES (?, ?)`;
        const [result] = await db.execute(sqlInsert, [name, parentId]);

        res.status(201).json({ message: 'Category created successfully', categoryId: result.insertId });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Error creating category' });
    }
});  

// image resizing route
app.post("/admin/imagesizing",validatetoken_2,async(req,res) =>{
    const {height,width} = req.body;
    try{
    let sql = "UPDATE size SET height = ?,width =? WHERE id = ?"
    const img_1 = await db.execute(sql,[height,width,1]);
    res.json("image sizing updated")
    }catch(err){
        console.log(err);
        res.status(404).json("cannot resize image");
    }
})


app.listen(3000, () => {
    console.log("server running successfully");
});


