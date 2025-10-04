'use client';

import { useState } from 'react';
import { uploadFile } from './actions'; // Import the new server action

export default function UploadTestPage() {
  const [message, setMessage] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file first.');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');
    setFileUrl('');

    const formData = new FormData(event.currentTarget);
    const result = await uploadFile(formData);

    if (result.success) {
      setMessage('✅ File uploaded successfully!');
      setFileUrl(result.url);
    } else {
      setMessage(`❌ Error: ${result.error}`);
      setFileUrl('');
    }
    setUploading(false);
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', color: 'white' }}>
      <h1>File Upload Test Page (Server Action)</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="file" style={{ display: 'block', marginBottom: '10px' }}>
            Choose a file to upload:
          </label>
          <input
            id="file"
            type="file"
            name="file" // Name is required for FormData
            required
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          style={{ marginTop: '20px', padding: '10px 20px' }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      {message && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <p>{message}</p>
          {fileUrl && (
            <p>
              File URL:{' '}
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'lightblue' }}>
                {fileUrl}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}