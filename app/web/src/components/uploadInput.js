import { api, BUCKET_NAME } from '../api';
import { useState } from 'react';

const FILE_CHUNK_SIZE = 1024 * 1024 * 5;

function UploadInput({fileList, setFileList }) {
    const [ selectedFile, setSelectedFile ] = useState();
    const [ progressArray, setProgressArray ] = useState([])
    const [ uploadProgress, setUploadProgress ] = useState(0);

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

    async function fetchUploadIdAndParts(filename, numberOfParts) {
        try {
            const response = await api.get(`/buckets/${BUCKET_NAME}/files/${filename}/presigned/upload/multipart?parts=${numberOfParts}`);

            if (response.status >= 400) {
                throw response.data;
            }

            return response.data;
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

    function getFileChunks(file) {
        const chunks = [];
        const finalPointer = file.size;
        let startPointer = 0;

        while (startPointer < finalPointer) {
            const newStartPointer = startPointer + FILE_CHUNK_SIZE;
            
            const slice = file.slice(startPointer, newStartPointer);
            chunks.push(slice);
            
            startPointer = newStartPointer; 
        }

        return chunks;
    }

    async function completeMultipartUpload(filename, uploadId, partsETags) {

        try {
            const response = await api.post(`/buckets/${BUCKET_NAME}/files/${filename}/presigned/upload/multipart`, {
                uploadId,
                partsETags
            });

            if (response.status >= 400) {
                throw response.data;
            }

            alert(`Completed multipart upload for ${filename}`);
        } catch (e) {
            console.log(e);
        }
    }
    
    async function uploadProgressHandler(progressEvent, numberOfParts, index) {
        if (progressEvent.loaded >= progressEvent.total) return;

        const currentProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgressArray((progressArray) => {
            progressArray[index] = currentProgress;
            
            const sum = progressArray.reduce((acc, curr) => acc + curr);
            setUploadProgress(Math.round(sum / numberOfParts));
            
            return progressArray;
        });
    }

    /**
     * @param {File} file 
     */
    async function multipartUpload(file) {
        const chunks = getFileChunks(file);

        const { uploadId, parts } = await fetchUploadIdAndParts(file.name, chunks.length);

        const promises = [];

        parts.map(({ url, part }) => {
            const index = part - 1;
            
            promises.push(
                api.put(url, chunks[index], {
                    onUploadProgress: (e) => uploadProgressHandler(e, chunks.length, index)
                })
            );
        });

        const response = await Promise.all(promises);

        const partsETags = response.map((part, index) => {
            return {
                ETag: part.headers.etag,
                PartNumber: (index + 1)
            }
        });

        completeMultipartUpload(file.name, uploadId, partsETags);
    }

    async function singlepartUpload(file) {
        const url = await fetchUploadUrl(file.name);
        const response = await api.put(url, file, {
            onUploadProgress: (progressEvent) => {
                setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        });

        if (response.status >= 400) {
            throw response.data;
        }

        alert(`${file.name} uploaded successfully!`);
    }

    async function onUploadButtonClick() {
        if (selectedFile === undefined) {
            alert('Please, first select a file.');
            return;
        }

        try {
            if (selectedFile.size > FILE_CHUNK_SIZE) {
                await multipartUpload(selectedFile);
            } else {
                await singlepartUpload(selectedFile);
            }
        } catch (e) {
            console.log(e);
        }

        setFileList([...fileList, selectedFile.name]);
        setUploadProgress(0);
        setProgressArray([]);
        document.getElementById('fileInput').value = '';
    }

    return (
        <div>
            <input id="fileInput" type="file" onChange={handleInputChange}/>

            <button onClick={onUploadButtonClick}>Upload file</button>

            {uploadProgress !== 0 ? (
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