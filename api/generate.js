// api/generate.js

import { VertexAI } from '@google-cloud/vertexai';

// This is the final, clean version of the server code.
// It relies on Vercel Environment Variables.
// GCP_PROJECT_ID: Your Google Cloud Project ID.
// GCP_SERVICE_ACCOUNT_KEY: Your Base64-encoded service account key.

export default async function handler(request, response) {
  // --- CORS Configuration ---
  const allowedOrigins = ['https://www.nbdomains.com', 'https://nbdomains.com'];
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  // --- End CORS Configuration ---

  if (request.method !== 'POST') {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Decode the Base64 encoded key from the environment variable
    const decodedKey = Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
    const credentials = JSON.parse(decodedKey);
    
    // Initialize Vertex AI with the credentials
    const vertex_ai = new VertexAI({
      project: process.env.GCP_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: { credentials }
    });

    const model = 'imagegeneration@006';
    const generativeModel = vertex_ai.getGenerativeModel({ model });
    
    const { prompt } = request.body;
    if (!prompt) {
      return response.status(400).json({ error: "Prompt is required" });
    }

    // Generate the image
    const resp = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generation_config: { "number_of_images": 1 },
    });

    const base64ImageData = resp.response.candidates[0].content.parts[0].file_data.file_uri.replace("data:image/png;base64,", "");
    
    // Send the image data back to the front-end
    return response.status(200).json({ image_base64: base64ImageData });

  } catch (error) {
    console.error("--- SERVER ERROR ---", error);
    return response.status(500).json({ error: "An internal server error occurred.", details: error.message });
  }
}
