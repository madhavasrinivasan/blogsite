import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [latestPosts, setLatestPosts] = useState([]);
  const [error, setError] = useState(null); // Add this line

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
        console.log('Token being sent in request:', token);

        if (!token) {
          console.error('No token found in localStorage');
          setError('No token found. Please log in.'); // Add this line
          return;
        }
        const response = await axios.get('http://192.168.29.180:3000/home', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Fetched data:', response.data);
        setLatestPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Error fetching posts'); // Add this line
      }
    };
   
    fetchPosts();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>LATEST POSTS</h2>
      {Array.isArray(latestPosts) ? (
        <div className="post-grid"> 
          {latestPosts.map(post => {
            const imageSrc = post.images && post.images.length > 0 
              ? `http://192.168.29.180:3000/images/${post.images[0]}` 
              : ''; // Or a placeholder image URL

            return (
              <div key={post.id} className="post-card">
                <div className='images'>
                  {imageSrc && <img src={imageSrc} alt={post.title} />} 
                </div>
                <div className='title'>
                  
                  <h3>{post.title}</h3> 
                  <p className='name'>CATEGORY: {post.category_id} | POST: {post.id}</p>
                </div>
                <Link to={`/post/${post.id}`} className="continue-reading-button">
                  Continue Reading
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div>Loading posts...</div>
      )}
    </div>
  );
}

export default Home;
