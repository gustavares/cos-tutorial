import { useEffect, useState } from 'react';
import FileList from './components/fileList';
import UploadInput from './components/uploadInput';
import { api, BUCKET_NAME } from './api';
import './App.css';

function App() {
  const [ fileList, setFileList ] = useState([]);
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
      (async () => {
        const files = await fetchFileList();

        setFileList(files);
        setLoading(loading => !loading);
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
    <div className="App">
      <UploadInput fileList={fileList} setFileList={setFileList}/>

      <h3>Files from {BUCKET_NAME} bucket</h3>
      {loading ? (
        <h4> Loading ... </h4>
      ) : (
        <FileList fileList={fileList} />
      )}
    </div>
  );
}

export default App;
