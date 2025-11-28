import { v2 as cloudinary } from 'cloudinary';
import * as googleTTS from 'google-tts-api';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generates an audio response from text and uploads it to Cloudinary
 * @param text The text to convert to speech
 * @returns The secure URL of the uploaded audio file
 */
export async function generateAudioResponse(text: string): Promise<string> {
  try {
    // 1. Generate Audio Base64 Chunks from Google TTS
    // getAllAudioBase64 automatically splits long text into chunks < 200 chars
    const audioChunks = await googleTTS.getAllAudioBase64(text, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    // 2. Concatenate Audio Chunks
    // Each chunk is a base64 string of an MP3 file.
    // To concatenate MP3s, we can simply concatenate their binary data.
    const audioBuffers = audioChunks.map(chunk => Buffer.from(chunk.base64, 'base64'));
    const combinedBuffer = Buffer.concat(audioBuffers);
    
    // Convert back to base64 for Cloudinary upload
    const combinedBase64 = combinedBuffer.toString('base64');
    const dataUri = `data:audio/mp3;base64,${combinedBase64}`;

    // 3. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'video', // Cloudinary treats audio as 'video' resource type
      folder: 'ghana-poc-responses',
      public_id: `response_${Date.now()}`,
    });

    console.log('Audio response uploaded to Cloudinary:', uploadResult.secure_url);
    return uploadResult.secure_url;

  } catch (error) {
    console.error('Error generating audio response:', error);
    // Fallback: Return null or throw, controller handles it
    throw new Error('Failed to generate audio response');
  }
}
