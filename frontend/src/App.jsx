import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileType,
  Loader2,
  Zap
} from 'lucide-react';

// API 配置 - 使用相对路径，让 Nginx 处理代理
const API_BASE = '/api';

// 文件类型图标
const FileIcon = ({ type }) => {
  if (type.includes('pdf')) return <FileType className="w-6 h-6 text-red-500" />;
  if (type.includes('word') || type.includes('docx')) return <FileType className="w-6 h-6 text-blue-500" />;
  return <FileText className="w-6 h-6 text-gray-500" />;
};

// 主应用组件
function App() {
  const [files, setFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [progress, setProgress] = useState(0);

  // 文件上传处理
  const onDrop = useCallback(async (acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc');
    });

    if (validFiles.length === 0) {
      showMessage('error', '请上传 PDF 或 Word 文件');
      return;
    }

    const newFiles = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      id: Math.random().toString(36).substr(2, 9)
    }));

    setFiles(prev => [...prev, ...newFiles]);
    showMessage('success', `已添加 ${newFiles.length} 个文件`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  // 显示消息
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // 删除文件
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // 清空所有文件
  const clearAll = () => {
    setFiles([]);
    setConvertedFiles([]);
    showMessage('success', '已清空所有文件');
  };

  // 开始转换
  const startConvert = async () => {
    if (files.length === 0) {
      showMessage('error', '请先上传文件');
      return;
    }

    setConverting(true);
    setProgress(0);
    const total = files.length;
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      
      try {
        // 上传文件
        const formData = new FormData();
        formData.append('file', fileItem.file);
        
        const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 转换文件
        const convertRes = await axios.post(`${API_BASE}/convert`, {
          filename: uploadRes.data.filename
        });

        results.push({
          ...fileItem,
          status: 'completed',
          downloadUrl: convertRes.data.download_url,
          markdownContent: convertRes.data.content
        });

        setProgress(((i + 1) / total) * 100);
      } catch (error) {
        results.push({
          ...fileItem,
          status: 'error',
          error: error.message
        });
      }
    }

    setConvertedFiles(results);
    setConverting(false);
    showMessage('success', `转换完成！成功 ${results.filter(r => r.status === 'completed').length} 个`);
  };

  // 下载单个文件
  const downloadFile = (url, filename) => {
    window.open(url, '_blank');
  };

  // 下载所有文件
  const downloadAll = async () => {
    const completed = convertedFiles.filter(f => f.status === 'completed');
    if (completed.length === 0) {
      showMessage('error', '没有可下载的文件');
      return;
    }

    for (const file of completed) {
      downloadFile(file.downloadUrl, file.name.replace(/\.[^/.]+$/, '.md'));
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Doc2MD</h1>
                <p className="text-slate-400 text-sm">智能文档转 Markdown 工具</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">支持 PDF、Word 格式</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 上传区域 */}
        <div 
          {...getRootProps()} 
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-out
            ${isDragActive 
              ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/25' 
              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`
              w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
              ${isDragActive 
                ? 'bg-cyan-500/20 scale-110' 
                : 'bg-slate-700/50'}
            `}>
              <Upload className={`w-10 h-10 transition-colors ${isDragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            </div>
            
            <div>
              <p className="text-xl font-semibold text-white mb-2">
                {isDragActive ? '释放文件开始上传' : '拖拽文件到此处'}
              </p>
              <p className="text-slate-400">
                或 <span className="text-cyan-400 hover:text-cyan-300">点击选择文件</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="px-3 py-1 bg-slate-700/50 rounded-full">PDF</span>
              <span className="px-3 py-1 bg-slate-700/50 rounded-full">DOCX</span>
              <span className="px-3 py-1 bg-slate-700/50 rounded-full">DOC</span>
            </div>
          </div>
        </div>

        {/* 消息提示 */}
        {message.text && (
          <div className={`
            mt-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2
            ${message.type === 'error' 
              ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
              : 'bg-green-500/10 border border-green-500/20 text-green-400'}
          `}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">待转换文件 ({files.length})</h2>
              <button 
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors"
                >
                  <FileIcon type={file.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-slate-400 text-sm">{formatSize(file.size)}</p>
                  </div>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* 转换按钮 */}
            <button
              onClick={startConvert}
              disabled={converting}
              className="
                w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white
                bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-cyan-500/25
                flex items-center justify-center gap-2
              "
            >
              {converting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  转换中... {progress.toFixed(0)}%
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  开始转换
                </>
              )}
            </button>

            {/* 进度条 */}
            {converting && (
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* 转换结果 */}
        {convertedFiles.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">转换结果</h2>
              <button 
                onClick={downloadAll}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                全部下载
              </button>
            </div>

            <div className="space-y-3">
              {convertedFiles.map((file, index) => (
                <div 
                  key={index}
                  className={`
                    flex items-center gap-4 p-4 border rounded-xl
                    ${file.status === 'completed' 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-red-500/5 border-red-500/20'}
                  `}
                >
                  {file.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className={`text-sm ${file.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                      {file.status === 'completed' ? '转换成功' : file.error}
                    </p>
                  </div>
                  {file.status === 'completed' && (
                    <button 
                      onClick={() => downloadFile(file.downloadUrl, file.name.replace(/\.[^/.]+$/, '.md'))}
                      className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-slate-500 text-sm">
          <p>Doc2MD - 本地处理，保护隐私</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
