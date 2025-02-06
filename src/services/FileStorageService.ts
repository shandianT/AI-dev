import axios from 'axios';

interface FileUploadResponse {
  url: string;
  filename: string;
  path: string;
}

class FileStorageService {
  private baseUrl: string;
  private uploadEndpoint: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.uploadEndpoint = `${this.baseUrl}/api/upload`;
  }

  async uploadFile(file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<FileUploadResponse>(
        this.uploadEndpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  async downloadFile(fileUrl: string): Promise<Blob> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('文件下载失败:', error);
      throw error;
    }
  }
}

export default new FileStorageService(); 