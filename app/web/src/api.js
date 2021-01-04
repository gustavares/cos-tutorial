import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

export const BUCKET_NAME = 'cos-tutorial-presigned';