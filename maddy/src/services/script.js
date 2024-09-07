import axios from "axios"

export const addPost = async (data)=>{
    try {
        const response = await axios.post('http://localhost:3000/posts' ,data )
    
        return response.data
    } catch (error) {
      console.log(err)
        
    }
} 

// export const login_1 = async (data) =>{
//     try{
//         const response = await axios.post('http://192.168.29.180:3000/login', data,{
//             withCredentials: true,

//         })

//         return response.data
//     }catch(err){ 
//         console.log(err)
        
//     }
// }