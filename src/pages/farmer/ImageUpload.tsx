import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  Leaf,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { predictionApi } from '@/services/api';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

const CROP_TYPES = [
  { value: 'tomato', label: 'Tomato' },
  { value: 'potato', label: 'Potato' },
  { value: 'corn', label: 'Corn / Maize' },
  { value: 'apple', label: 'Apple' },
  { value: 'grape', label: 'Grape' },
  { value: 'pepper', label: 'Pepper' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'peach', label: 'Peach' },
  { value: 'other', label: 'Other / Unknown' },
];

const ImageUpload: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WEBP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
  });

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await predictionApi.uploadImage(selectedFile, cropType || undefined);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data?.id) {
        navigate(`/predictions/${response.data.id}`);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Failed to analyze image. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-green">Upload Plant Image</h1>
          <p className="text-muted-foreground">
            Upload a clear photo of a plant leaf for disease detection
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Select Image
            </CardTitle>
            <CardDescription>
              Drag and drop or click to select a plant leaf image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!preview ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-early-green bg-early-green/5'
                    : 'border-matcha hover:border-early-green hover:bg-pistage/50'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-pistage flex items-center justify-center">
                    <Upload className="w-8 h-8 text-calm-green" />
                  </div>
                  <div>
                    <p className="font-medium text-calm-green">
                      {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse from your device
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-ever-green/30 rounded">JPG</span>
                    <span className="px-2 py-1 bg-ever-green/30 rounded">PNG</span>
                    <span className="px-2 py-1 bg-ever-green/30 rounded">WEBP</span>
                    <span className="px-2 py-1 bg-ever-green/30 rounded">Max 10MB</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Selected plant"
                  className="w-full h-64 object-contain rounded-xl bg-pistage"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-lg">
                  <p className="text-sm font-medium text-calm-green truncate max-w-[200px]">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cropType">Crop Type (Optional)</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger id="cropType">
                  <SelectValue placeholder="Select crop type for better accuracy" />
                </SelectTrigger>
                <SelectContent>
                  {CROP_TYPES.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {crop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting the crop type can improve prediction accuracy
              </p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Analyzing image...</span>
                  <span className="font-medium text-calm-green">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button
              className="w-full bg-calm-green hover:bg-resting-green text-white"
              size="lg"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Leaf className="w-4 h-4 mr-2" />
                  Analyze Plant
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-matcha/30 bg-ever-green/20">
          <CardHeader>
            <CardTitle className="text-calm-green text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Tips for Best Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-early-green mt-2 flex-shrink-0" />
                Ensure good lighting — natural daylight works best
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-early-green mt-2 flex-shrink-0" />
                Focus on a single leaf showing symptoms
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-early-green mt-2 flex-shrink-0" />
                Make sure the image is sharp and not blurry
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-early-green mt-2 flex-shrink-0" />
                Include both healthy and affected areas if visible
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ImageUpload;
