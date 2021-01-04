import { useEffect, useState } from 'react';
import File from './file';
import { api, BUCKET_NAME } from '../api';

function FileList() {
    const [ fileList, setFileList ] = useState([]);
    
    useEffect(() => {
        (async () => {
            const files = await fetchFileList();

            setFileList(files);
        })();
    }, []);

    async function fetchFileList() {
        try {
            const response = await api.get(`/buckets/${BUCKET_NAME}/files`);

            if (response.status >= 400) {
                throw response.data;
            }

            return response.data.files;
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <ul>
            {fileList.map((filename, index) => {
                
                return (
                    <File key={index} filename={filename}/>
                )
            })}
        </ul>
    );
}

export default FileList;