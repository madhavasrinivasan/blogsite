const express = require('express'); 
const jwt = require('jsonwebtoken'); 

const createtoken = (user) => {
  const accesstoken = jwt.sign({ username: user.username, id: user.id,role:user.role}, "maddy");
  return accesstoken; 
};

const validatetoken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token);
  console.log('All headers:', req.headers);

  if (!token) {
    return res.status(401).json({ message: "Please login first" });
  }

  try {
    const decoded = jwt.verify(token, "maddy");
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(403).json("Access denied");
  }
};

const createToken_1 = (user) => {
const accesstoken_1 = jwt.sign({ username: user.username, id: user.id,role:user.role },"madyy2803");
return accesstoken_1;
}; 



const validatetoken_1 = (req, res, next) => {
const authHeader = req.headers['authorization'];
const token_1= authHeader && authHeader.split(' ')[1]; 
  
if (!token_1) {
  return res.status(401).json({ message: "Please login first" });
}
    
    // if (!token_1) return res.status(401).json({ message: "Please login first" });
    try {
      const verifytoken_1 = jwt.verify(token_1, "madyy2803");
      if (verifytoken_1) {
        req.user = verifytoken_1;
        next();
      }
    } catch (err) {
      console.log(err);
      res.status(400).json("Access denied");
    }
  };

  const createtoken_2 = (user) =>{
  const accesstoken_2 = jwt.sign({username:user.username,id:user.id,role:user.role},"madhava2803")
  console.log(user);
  return accesstoken_2; 
  };

  const validatetoken_2 = (req,res,next) =>{
    const authHeader = req.headers['authorization'];
const token_2= authHeader && authHeader.split(' ')[1]; 

     if (!token_2) return res.status(401).json({message:"please login first"})

      try{
    const validatetoken_2 = jwt.verify(token_2,"madhava2803")
    if(validatetoken_2){
      req.user = validatetoken_2;
      next();
      } 
     }catch(err){
      console.log(err);
      res.status(400).json("Access denied");
    }

}

const validateToken = (req, res, next) => {
  console.log('validateToken called');
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);

  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const token = req.cookies.token;
  const token_1 = req.cookies.token_1;
  const token_2 = req.cookies.token_2;

  console.log('Header token:', headerToken);
  console.log('Cookie tokens:', token, token_1, token_2);

  const verifyToken = (token, secret) => {
    return new Promise((resolve) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          console.log(`Token verification failed for secret ${secret}:`, err.message);
          resolve(null);
        } else {
          resolve(decoded);
        }
      });
    });
  };

  const promises = [
    headerToken ? [
      verifyToken(headerToken, "maddy"),
      verifyToken(headerToken, "madyy2803"),
      verifyToken(headerToken, "madhava2803")
    ] : [],
    token ? verifyToken(token, "maddy") : null,
    token_1 ? verifyToken(token_1, "madyy2803") : null,
    token_2 ? verifyToken(token_2, "madhava2803") : null
  ].flat();

  Promise.all(promises)
    .then((results) => {
      const validToken = results.find((result) => result !== null);
      if (validToken) {
        console.log('Valid token found:', validToken);
        req.user = validToken;
        next();
      } else {
        console.log('No valid token found');
        return res.status(401).json({ message: "Please login first" });
      }
    })
    .catch((err) => {
      console.error('Unexpected error during token verification:', err);
      res.status(400).json("Access denied");
    });
};
 

module.exports = { createtoken, validatetoken,createToken_1,validatetoken_1,createtoken_2,validatetoken_2,validateToken};
