import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { documentService } from '../services/documentService';
import type { Document } from '../types/project';
import { toast } from 'react-hot-toast';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'requesting' | 'uploading' | 'confirming' | 'success' | 'error';
  errorMessage?: string;
}

const ProjectDocuments: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Action State
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectId) {
      loadDocuments();
    }
  }, [projectId]);

  const loadDocuments = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await documentService.getDocuments(projectId);
      setDocuments(data);
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = (files: File[]) => {
    if (!projectId) return;
    
    // Filter oversized files (e.g., > 1GB)
    const MAX_SIZE = 1024 * 1024 * 1024; // 1GB
    const validFiles = files.filter(f => {
      if (f.size > MAX_SIZE) {
        toast.error(`File ${f.name} quá lớn (Tối đa 1GB)`);
        return false;
      }
      return true;
    });

    const newUploads = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'requesting' as const
    }));

    setUploadingFiles(prev => [...newUploads, ...prev]);

    // Process each file
    newUploads.forEach(upload => processUpload(upload));
  };

  const updateUploadState = (id: string, updates: Partial<UploadingFile>) => {
    setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const processUpload = async (upload: UploadingFile) => {
    if (!projectId) return;
    
    try {
      // 1. Request Upload URL
      const requestData = {
        fileName: upload.file.name,
        fileSizeBytes: upload.file.size,
        fileType: upload.file.type || 'application/octet-stream'
      };
      
      const uploadRes = await documentService.requestUpload(projectId, requestData);
      
      updateUploadState(upload.id, { status: 'uploading' });

      // 2. Upload directly to MinIO
      await documentService.uploadToMinio(uploadRes.uploadUrl, upload.file, (percent) => {
        updateUploadState(upload.id, { progress: percent });
      });

      updateUploadState(upload.id, { status: 'confirming' });

      // 3. Confirm Upload
      await documentService.confirmUpload(projectId, uploadRes.documentId);
      
      updateUploadState(upload.id, { status: 'success', progress: 100 });
      
      // Refresh document list
      loadDocuments();
      
      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== upload.id));
      }, 3000);

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
      updateUploadState(upload.id, { status: 'error', errorMessage: errorMsg });
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    if (!projectId) return;
    
    try {
      const url = await documentService.getDownloadUrl(projectId, documentId, false); // preview = false -> forces download
      // Create a temporary link to download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      toast.error('Lỗi khi tải xuống');
    }
  };

  const openEditModal = (doc: Document) => {
    setEditDoc(doc);
    setEditFileName(doc.fileName);
    setEditDescription(doc.description || '');
  };

  const handleUpdateDocument = async () => {
    if (!projectId || !editDoc || !editFileName.trim()) return;
    
    try {
      setIsSaving(true);
      await documentService.updateDocument(projectId, editDoc.id, {
        fileName: editFileName,
        description: editDescription
      });
      toast.success('Cập nhật tài liệu thành công');
      setEditDoc(null);
      loadDocuments();
    } catch (error) {
      toast.error('Không thể cập nhật tài liệu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!projectId || !deleteDoc) return;
    
    try {
      setIsDeleting(true);
      await documentService.deleteDocument(projectId, deleteDoc.id);
      toast.success('Đã xóa tài liệu');
      setDeleteDoc(null);
      loadDocuments();
    } catch (error) {
      toast.error('Không thể xóa tài liệu');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = async (doc: Document) => {
    if (!projectId) return;
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewLoading(true);

    try {
      const url = await documentService.getDownloadUrl(projectId, doc.id, true); // preview = true -> displays inline
      setPreviewUrl(url);
    } catch (error) {
      toast.error('Không thể mở bản xem trước');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">description</span>
          Tài liệu
        </h3>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          Tải lên
        </button>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          className="hidden" 
        />
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container/30 shrink-0">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-6">Tên tài liệu</div>
            <div className="col-span-2">Dung lượng</div>
            <div className="col-span-2">Phân loại</div>
            <div className="col-span-2 text-right">Thao tác</div>
          </div>
        </div>
        
        {loading && (
          <div className="p-4 flex items-center justify-center text-sm text-on-surface-variant py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {!loading && documents.length === 0 && (
          <div className="p-4 flex flex-col items-center justify-center text-sm text-on-surface-variant py-12">
            <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">find_in_page</span>
            Chưa có tài liệu nào
          </div>
        )}
        
        {!loading && documents.length > 0 && (
          <div className="divide-y divide-outline-variant/20 overflow-y-auto">
            {documents.slice(0, 20).map(doc => (
              <div 
                key={doc.id} 
                className="p-4 grid grid-cols-12 items-center gap-4 hover:bg-surface-container/10 transition-colors cursor-pointer"
                onClick={() => handlePreview(doc)}
              >
                <div className="col-span-6 flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {doc.tag === '[Tài liệu]' ? 'description' : doc.tag === '[Media]' ? 'perm_media' : 'draft'}
                    </span>
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium text-on-surface truncate" title={doc.fileName}>{doc.fileName}</div>
                    <div className="text-xs text-on-surface-variant">Tải lên: {new Date(doc.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-on-surface-variant">
                  {formatBytes(doc.fileSizeBytes)}
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/30">
                    {doc.tag}
                  </span>
                </div>
                <div className="col-span-2 text-right flex justify-end gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(doc); }}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Sửa thông tin"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc.id, doc.fileName); }}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Tải xuống"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteDoc(doc); }}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {documents.length > 20 && (
              <div className="p-3 text-center text-xs text-on-surface-variant bg-surface-container-lowest">
                Đang hiển thị 20 tài liệu gần nhất.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Uploading Progress List */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3 shrink-0"
          >
            <h4 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider">Đang tải lên</h4>
            {uploadingFiles.map(f => (
              <div key={f.id} className="bg-surface-container-lowest border border-outline-variant/30 p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">insert_drive_file</span>
                    <span className="font-medium text-sm truncate">{f.file.name}</span>
                    <span className="text-xs text-on-surface-variant">({formatBytes(f.file.size)})</span>
                  </div>
                  <div className="text-xs font-semibold">
                    {f.status === 'error' ? (
                      <span className="text-error flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Thất bại</span>
                    ) : f.status === 'success' ? (
                      <span className="text-primary flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Hoàn tất</span>
                    ) : (
                      <span className="text-on-surface-variant">{f.progress}%</span>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${f.status === 'error' ? 'bg-error' : f.status === 'success' ? 'bg-primary' : 'bg-blue-500'}`} 
                    style={{ width: `${f.progress}%` }}
                  ></div>
                </div>
                
                {f.status === 'error' && (
                  <div className="text-xs text-error">{f.errorMessage}</div>
                )}
                {f.status === 'requesting' && (
                  <div className="text-xs text-on-surface-variant">Đang xin cấp phép...</div>
                )}
                {f.status === 'confirming' && (
                  <div className="text-xs text-on-surface-variant">Đang xác nhận...</div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & Drop Zone (Smaller version) */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`shrink-0 bg-surface-container-lowest border-2 rounded-xl shadow-sm border-dashed flex items-center justify-between px-6 py-4 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/50'}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">cloud_upload</span>
          </div>
          <div>
            <h4 className="text-base font-bold">Kéo thả file vào đây để tải lên</h4>
            <p className="text-xs text-on-surface-variant">Hỗ trợ mọi định dạng. Tối đa 1GB/file.</p>
          </div>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 px-4 py-2 bg-surface-container hover:bg-outline-variant/30 text-on-surface rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">folder_open</span>
          Chọn file
        </button>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={closePreview}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface flex flex-col overflow-hidden w-full h-full"
              onClick={(e) => e.stopPropagation()} // Prevent close on modal click
            >
              {/* Header */}
              <div className="py-1 px-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0 bg-surface-container-lowest text-xs">
                <div className="flex items-center gap-2 truncate pr-4 flex-1">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                    {previewDoc.tag === '[Tài liệu]' ? 'description' : previewDoc.tag === '[Media]' ? 'perm_media' : 'draft'}
                  </span>
                  <div className="flex items-center gap-1.5 truncate">
                    <h3 className="font-medium text-on-surface truncate" title={previewDoc.fileName}>{previewDoc.fileName}</h3>
                    <span className="text-[11px] text-on-surface-variant shrink-0">({formatBytes(previewDoc.fileSizeBytes)})</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button 
                    onClick={() => handleDownload(previewDoc.id, previewDoc.fileName)}
                    className="py-1 px-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span className="font-medium">Tải xuống</span>
                  </button>
                  <div className="w-px h-3 bg-outline-variant/50 mx-1"></div>
                  <button 
                    onClick={closePreview}
                    className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 bg-surface-container-lowest flex items-center justify-center relative overflow-hidden">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-primary">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium">Đang tải bản xem trước...</p>
                  </div>
                ) : !previewUrl ? (
                  <div className="text-on-surface-variant text-center p-8">
                    <span className="material-symbols-outlined text-5xl mb-2 text-outline-variant">error_outline</span>
                    <p>Không thể tải bản xem trước lúc này.</p>
                  </div>
                ) : (
                  <>
                    {previewDoc.fileType.startsWith('image/') ? (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img src={previewUrl} alt={previewDoc.fileName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : previewDoc.fileType.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-black">
                        <video src={previewUrl} controls className="max-w-full max-h-full outline-none" autoPlay />
                      </div>
                    ) : previewDoc.fileType === 'application/pdf' ? (
                      <iframe src={previewUrl} title={previewDoc.fileName} className="w-full h-full border-0" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-on-surface-variant p-8">
                        <span className="material-symbols-outlined text-6xl text-outline-variant">find_in_page</span>
                        <p className="font-medium text-center">Định dạng file không hỗ trợ xem trước trực tiếp.</p>
                        <button 
                          onClick={() => handleDownload(previewDoc.id, previewDoc.fileName)}
                          className="px-6 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-blue-700 transition-colors mt-2"
                        >
                          Tải file về máy
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editDoc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
                <h3 className="text-lg font-bold">Chỉnh sửa tài liệu</h3>
                <button onClick={() => setEditDoc(null)} className="text-on-surface-variant hover:bg-outline-variant/20 p-2 rounded-full"><span className="material-symbols-outlined text-[20px]">close</span></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tên tài liệu</label>
                  <input 
                    type="text" 
                    value={editFileName} 
                    onChange={e => setEditFileName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Mô tả (tùy chọn)</label>
                  <textarea 
                    value={editDescription} 
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-y"
                    placeholder="Nhập ghi chú cho tài liệu này..."
                  ></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest">
                <button onClick={() => setEditDoc(null)} className="px-5 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-outline-variant/20">Hủy</button>
                <button onClick={handleUpdateDocument} disabled={isSaving || !editFileName.trim()} className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : 'Lưu'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteDoc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6"
            >
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Xóa tài liệu?</h3>
              <p className="text-on-surface-variant text-sm mb-6">Bạn có chắc chắn muốn xóa tài liệu <span className="font-semibold text-on-surface">"{deleteDoc.fileName}"</span>? Hành động này không thể hoàn tác.</p>
              
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteDoc(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-container hover:bg-outline-variant/20 transition-colors">Hủy</button>
                <button onClick={handleDeleteDocument} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                  {isDeleting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : 'Xóa ngay'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectDocuments;
