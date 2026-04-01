import axios from "axios"

export const api = axios.create({
    baseURL: typeof window !== 'undefined' 
        ? window.location.origin + '/api' 
        : "http://localhost:4000/api",
    withCredentials: true
})
