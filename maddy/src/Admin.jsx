import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";

const Admin = () => {
    const [user, setUser] = useState([]);
    const [selectedTap, setSelectedTap] = useState(0);
    const [formData, setFormData] = useState({});
    const [formData_1, setFormData_1] = useState({});
    const [error_1, setError_1] = useState(null);
    const [error_2,setError_2] = useState(null);
    const[formData_2,setFormData_2] = useState({});
    const[post,setPost] = useState(null);

// getting post 

    useEffect(() => {
        const fetchinfo = async () => {
            try {
                const res = await fetch('http://192.168.29.180:3000/home');
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error('Error Fetching user data:', err);
            }
        };
        fetchinfo();
    }, []);

// add post 

    function handleChange(e) {
        if (e.target.name === "images") {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setFormData({ ...formData, image: reader.result });
            };
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/posts', formData);
            console.log(response.data);
        } catch (err) {
            console.log(err);
        }
    }
// for delete post
    function handleChange_1(e) {
        setFormData_1({ ...formData_1, [e.target.name]: e.target.value });
    }

    async function handleSubmit_1(e) {
        e.preventDefault();
        try {
            const response_1 = await axios.get("http://192.168.29.180:3000/GetPost", formData_1 );
            console.log(response_1.data);
            // Handle the response data as needed
        } catch (err) {
            console.log(err);
            setError_1(err.response?.data || "An error occurred");
        }
    }

    return (
        <div style={{ marginTop: 30 }}>
            <h1>Admin</h1>
            <div className='main1'>
                <div className="sidebar">
                    <ul className='list'>
                        <button onClick={() => setSelectedTap(1)}><li>ADD POST</li></button>
                        <button onClick={() => setSelectedTap(2)}><li>DELETE POST</li></button>
                        <button onClick={() => setSelectedTap(3)}><li>EDIT POST</li></button>
                        <button onClick={() => setSelectedTap(4)}><li>ADD Category</li></button>
                        <button onClick={() => setSelectedTap(5)}><li>CHANGE USER ROLE</li></button>
                        <button onClick={() => setSelectedTap(6)}><li>DELETE USER</li></button>
                        <button onClick={() => setSelectedTap(7)}><li>ROLES</li></button>
                    </ul>
                </div>
                <div>
                    {selectedTap === 1 && (
                        <form onSubmit={handleSubmit}>
                            <input onChange={handleChange} value={formData.title || ''} type="text" name="title" id="" />
                            <input onChange={handleChange} value={formData.body || ''} type="text" name="body" id="" />
                            <input onChange={handleChange} value={formData.category_name || ''} type="text" name="category_name" id="" />
                            <input onChange={handleChange} value={formData.subcategory_name || ''} type="text" name="subcategory_name" id="" />
                            <input onChange={handleChange} value={formData.variance_name || ''} type="text" name="variance_name" id="" />
                            <input onChange={handleChange} type="file" name="images" id="" />
                            <input type="submit" value="Submit" />
                        </form>
                    )}
                    {selectedTap === 2 && (
                        <form onSubmit={handleSubmit_1}>
                            <input onChange={handleChange_1} value={formData_1.title } type="text" name="title" id="title" />
                            <button type="submit">SEARCH</button>
                        </form>
                    )}
                    {error_1 && <p>{error_1}</p>}
                    {post && (
    post.map(posts => (
        <div key={posts.id}>
            <p>{posts.id}</p>
            <p>{posts.title}</p>
            <button onClick={() => handleDelete(posts.id)}>DELETE POST</button>
        </div>
    ))
)}
                </div>
            </div>
        </div>
    );
}

export default Admin;