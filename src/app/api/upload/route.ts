// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Get the total number of files
    const totalFiles = formData.get('totalFiles');
    const uploadTime = formData.get('uploadTime');
    
    console.log(`Processing ${totalFiles} files uploaded at ${uploadTime}`);
    
    // Process each file
    const files = [];
    for (let i = 0; i < parseInt(totalFiles as string); i++) {
      const file = formData.get(`file-${i}`) as File;
      if (!file) continue;
      
      // Here you would typically process the file - save to disk, upload to cloud storage, etc.
      // For this example, we'll just log the file details
      console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      files.push({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      files: files,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({
      success: false,
      message: 'Error uploading files',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}