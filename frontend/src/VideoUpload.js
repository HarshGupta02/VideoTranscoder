import React, { useState } from 'react';
import axios from 'axios';
import './Loader.css';

const VideoUpload = () => {

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    }

    const handleUpload = async () => {
        if(!selectedFile) {
            setUploadStatus('Please Upload the video first');
            return;
        }
        setIsUploading(true);
        setUploadStatus('');
        try {
            const {data} = await axios.post('http://localhost:5000/api/upload', {
                fileName : selectedFile.name,
                contentType : selectedFile.type
            });
            const preSignedUrl = data.PresignedURL;
            await axios.put(preSignedUrl, selectedFile, {
                headers: {
                    'Content-Type' : selectedFile.type
                }
            });
            setUploadStatus('Upload Successful');
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus('Upload Failed. Try again');
        } finally {
            setIsUploading(false);
        }
    }

  return (
    <div className='upload-container'>
        <h1>Upload Video</h1>
        <div className='ChooseVideo'>
            <input type='file' accept='video/*' onChange={handleFileChange}/>
            <button onClick={handleUpload} disabled = {isUploading}>Upload Video</button>
        </div>
        {isUploading && <div className='loader'></div>}
        <p>{uploadStatus}</p>
    </div>
  )
}

export default VideoUpload