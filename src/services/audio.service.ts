import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

/**
 * Download audio file from URL
 * @param audioUrl - URL of the audio file
 * @returns Path to the downloaded file
 */
export async function downloadAudio(audioUrl: string): Promise<string> {
  try {
    console.log(`Downloading audio from: ${audioUrl}`);
    
    // Use system temp directory (works on Vercel)
    const tempDir = os.tmpdir();
    
    // Generate unique filename
    const filename = `audio_${Date.now()}.ogg`;
    const filepath = path.join(tempDir, filename);
    
    // Download the audio file
    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      family: 4, // Force IPv4
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });
    
    // Save to file
    await writeFile(filepath, response.data);
    
    console.log(`Audio downloaded to: ${filepath}`);
    return filepath;
    
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert audio file to base64
 * @param filepath - Path to the audio file
 * @returns Base64 encoded audio data
 */
export function audioToBase64(filepath: string): string {
  try {
    const audioBuffer = fs.readFileSync(filepath);
    return audioBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting audio to base64:', error);
    throw new Error(`Failed to convert audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up temporary audio file
 * @param filepath - Path to the file to delete
 */
export async function cleanupAudioFile(filepath: string): Promise<void> {
  try {
    if (fs.existsSync(filepath)) {
      await unlink(filepath);
      console.log(`Cleaned up audio file: ${filepath}`);
    }
  } catch (error) {
    console.error('Error cleaning up audio file:', error);
    // Don't throw - cleanup errors shouldn't break the flow
  }
}

/**
 * Get MIME type from file extension
 * @param filepath - Path to the file
 * @returns MIME type string
 */
export function getMimeType(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.opus': 'audio/opus',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac'
  };
  
  return mimeTypes[ext] || 'audio/ogg'; // Default to ogg for WhatsApp
}
