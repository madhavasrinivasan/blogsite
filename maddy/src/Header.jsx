import React from "react";
import './App.css'; 
import { Link,Routes,Route,BrowserRouter } from 'react-router-dom'; 
import logo from './pictures/logo.jpg';
import Home from "./Home";
import Admin from "./Admin";
import Login from "./Login";

const Header = () => {
  return (
    <div>
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>
        <ul className="links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to ="/admin">Search</Link></li>
        </ul>
      </nav> 
      <Routes> 
        <Route path="/" element={<Home />} /> {/* Close the Route element properly */}
        <Route path="/admin" element={<Admin />}/>
        <Route path="/login" element={<Login />}/>
      </Routes>
    </div>
  )
}
  
  export default Header;