import { api, BUCKET_NAME } from "../api";

const File = ({ filename }) => {
    async function fetchDownloadUrl() {
        try {
            const response = await api.get(`/buckets/${BUCKET_NAME}/files/${filename}/presigned/download`);

            if (response.status >= 400) {
                throw response.data;
            }

            return response.data.url;
        } catch(e) {
            console.log(e);
        }
    }

    async function downloadFile() {
        const url = await fetchDownloadUrl();
        const a = document.createElement('a');

        a.target = '_blank';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
    }

    return (
        <>
            {filename !== undefined ? (
                <li style={{ listStyleType: "none", margin: "10px" }} >
                    <button onClick={downloadFile}>
                        {filename}
                    </button>
                </li>
            ) : (
                <></>
            )}
        </>
    )
}

export default File;