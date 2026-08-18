interface UploadState {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

interface Props {
  uploadState: UploadState | null;
  uploadHistory: UploadState[];
}

const getStatusColor = (status: string) => {
  if (status === 'success') return 'bg-green-50 border-green-200';
  if (status === 'error') return 'bg-red-50 border-red-200';
  if (status === 'uploading') return 'bg-blue-50 border-blue-200';
  return 'bg-gray-50 border-gray-200';
};

const getStatusIcon = (status: string) => {
  if (status === 'success') return '✅';
  if (status === 'error') return '❌';
  if (status === 'uploading') return '⏳';
  return '⏹️';
};

export default function UploadStatusDisplay({ uploadState, uploadHistory }: Props) {
  return (
    <>
      {uploadState && (
        <div className={`rounded-lg border-2 p-4 ${getStatusColor(uploadState.status)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getStatusIcon(uploadState.status)}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{uploadState.filename}</p>
              <p className="text-sm text-gray-700">{uploadState.message}</p>
              {uploadState.status === 'uploading' && (
                <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {uploadHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Upload History</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uploadHistory.map((upload, idx) => (
              <div key={idx} className={`rounded-lg border p-3 ${getStatusColor(upload.status)}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{getStatusIcon(upload.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 break-words">{upload.filename}</p>
                    <p className="text-sm text-gray-700">{upload.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
