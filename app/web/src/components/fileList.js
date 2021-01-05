
import File from './fileButton';

function FileList({ fileList }) {
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