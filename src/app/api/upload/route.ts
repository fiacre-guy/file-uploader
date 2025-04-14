// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    console.log("API: Processing upload request");
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log("API: No file provided");
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log("API: File received", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Define the path where files will be stored
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log("API: Creating uploads directory");
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Ensure the filename is safe
    const filename = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const filepath = path.join(uploadsDir, filename);
    
    console.log("API: Saving file to:", filepath);
    
    // Write the file to the server
    await writeFile(filepath, buffer);
    console.log("API: File saved successfully");
    
    // Return success response
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      filename: filename,
      path: `/uploads/${filename}`
    });
    
  } catch (error: any) {
    console.error('Error uploading file:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: `Error uploading file: ${error.message}` },
      { status: 500 }
    );
  }
}