import { api, BUCKET_NAME } from '../api';
import { useState } from 'react';

function UploadInput({fileList, setFileList }) {
    const [ selectedFile, setSelectedFile ] = useState();
    const [ uploadProgress, setUploadProgress ] = useState();

    async function fetchUploadUrl(filename) {
        try {
            const response = await api.get(`/buckets/${BUCKET_NAME}/files/${filename}/presigned/upload`);

            if (response.status >= 400) {
                throw response.data;
            }

            return response.data.url;
        } catch(e) {
            console.log(e);
        }
    }
    
    function handleInputChange(event) {
        const file = event.target.files[0];

        if (file) {
            setSelectedFile(file);
        }
    }

    async function uploadFile() {
        if (selectedFile === undefined) {
            alert('Please select a file first.');
            return;
        }

        try {
            const url = await fetchUploadUrl(selectedFile.name);
            const response = await api.put(url, selectedFile, {
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            });

            if (response.status >= 400) {
                throw response.data;
            }

            setFileList([...fileList, selectedFile.name]);
            setUploadProgress(undefined);
            
            alert(`${selectedFile.name} uploaded successfully!`);
        } catch (e) {
            console.log(e);
        }

        document.getElementById('fileInput').value = '';
    }

    return (
        <div>
            <input id="fileInput" type="file" onChange={handleInputChange}/>

            <button onClick={uploadFile}>Upload file</button>

            {uploadProgress ? (
                <span style={{ marginLeft: "30px"}}>
                    {uploadProgress}%
                </span>
            ) : (
                <></>
            )}
        </div>
    );
}

export default UploadInput;