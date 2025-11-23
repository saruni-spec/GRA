# Audio Support for WhatsApp Workflow

## Overview
The workflow controller now supports both **TEXT** and **AUDIO** inputs using Gemini 2.0 Flash's multimodal capabilities.

## How It Works

### For Audio Input:
1. **Receive audio URL** from WhatsApp webhook
2. **Download audio file** to temp directory
3. **Convert to base64** encoding
4. **Send to Gemini** with the audio data
5. **Gemini transcribes and extracts** transaction data
6. **Clean up** temporary file
7. **Return** extracted transaction

### For Text Input:
- Works as before - sends text directly to Gemini

## API Request Format

### Text Input (Existing)
```json
{
  "phoneNumber": "+233244123456",
  "inputType": "TEXT",
  "content": "I sold 5 bags of rice for 250 cedis"
}
```

### Audio Input (New)
```json
{
  "phoneNumber": "+233244123456",
  "inputType": "AUDIO",
  "audioUrl": "https://example.com/audio/message.ogg"
}
```

## Supported Audio Formats
- **OGG** (WhatsApp default)
- **MP3**
- **WAV**
- **M4A**
- **AAC**
- **OPUS**

## Response Format
```json
{
  "status": "SUCCESS",
  "replyText": "✅ Recorded: INCOME Sales - 250 GHS. Is this correct?",
  "requiresConfirmation": true,
  "extractedData": {
    "type": "INCOME",
    "category": "Sales",
    "amount": 250,
    "currency": "GHS"
  },
  "transcribedText": "[Audio transcribed and processed]"
}
```

## Technical Details

### Audio Processing Flow
```
Audio URL → Download → Base64 → Gemini API → JSON Response
                ↓
          Cleanup temp file
```

### Gemini Multimodal API
```typescript
await model.generateContent([
  {
    inlineData: {
      data: audioBase64,
      mimeType: 'audio/ogg'
    }
  },
  prompt
]);
```

### Error Handling
- **Download fails**: Returns 500 error
- **Gemini fails**: For text, falls back to regex; for audio, returns error
- **Cleanup always runs**: Even on errors (finally block)

## Files Created
- [`src/services/audio.service.ts`](file:///home/saruni/projects/ghana/src/services/audio.service.ts) - Audio utilities
- [`src/controllers/workflow.controller.ts`](file:///home/saruni/projects/ghana/src/controllers/workflow.controller.ts) - Updated with audio support

## Testing

### Test with Audio URL
```bash
curl -X POST http://localhost:3000/api/v1/workflow/process-input \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+233244123456",
    "inputType": "AUDIO",
    "audioUrl": "https://raw.githubusercontent.com/anars/blank-audio/master/1-second-of-silence.mp3"
  }'
```

### Test with Text (Still Works)
```bash
curl -X POST http://localhost:3000/api/v1/workflow/process-input \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+233244123456",
    "inputType": "TEXT",
    "content": "I sold 5 bags of rice for 250 cedis"
  }'
```

## WhatsApp Integration Notes

When integrating with WhatsApp:
1. Receive webhook with audio message
2. Extract `media_url` from WhatsApp payload
3. Download audio using WhatsApp Media API (requires auth token)
4. Pass the downloaded URL to this endpoint

Example WhatsApp webhook payload:
```json
{
  "type": "audio",
  "audio": {
    "id": "media_id_123",
    "mime_type": "audio/ogg; codecs=opus"
  }
}
```

You'll need to:
1. Get media URL: `GET https://graph.facebook.com/v18.0/{media_id}`
2. Download with auth: `Authorization: Bearer {access_token}`
3. Pass URL to this endpoint
