'use server'; // This directive marks these functions as Server Actions

import { bucket } from '@/app/service/storageConnection/storageConnection';

// This function runs ONLY on the server
export async function uploadFile(formData) {
  try {
    const file = formData.get('file');

    if (!file || file.size === 0) {
      return { success: false, error: 'No file was uploaded.' };
    }

    console.log('Server Action: Uploading file:', file.name);

    // 1. Read the file into a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Define the destination in the bucket
    const destination = `uploads/${Date.now()}-${file.name}`;
    const blob = bucket.file(destination);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.type,
    });

    // 3. Use a Promise to handle the stream's finish and error events
    await new Promise((resolve, reject) => {
      blobStream.on('finish', async () => {
        // Make the file public to get a URL
        await blob.makePublic();
        resolve();
      });
      blobStream.on('error', (err) => {
        reject(err);
      });
      // Write the buffer to the stream
      blobStream.end(buffer);
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    console.log('Server Action: File uploaded successfully:', publicUrl);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Server Action Error:', error);
    return { success: false, error: 'File upload failed due to a server error.' };
  }
}