import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { projectService } from '../services/projectService';
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
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  
  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Action State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [viewDocDetails, setViewDocDetails] = useState<Document | null>(null);
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
      const [data, members] = await Promise.all([
        documentService.getDocuments(projectId),
        projectService.getProjectMembers(projectId)
      ]);
      setDocuments(data);
      const mMap: Record<string, string> = {};
      members.forEach(m => {
        mMap[m.userId] = m.email.split('@')[0];
      });
      setMemberMap(mMap);
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
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

  const filteredAndSortedDocs = useMemo(() => {
    let result = [...documents];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(d => {
        const uploaderName = memberMap[d.uploadedByUserId] || 'Thành viên';
        return d.fileName.toLowerCase().includes(lower) || 
               (d.description && d.description.toLowerCase().includes(lower)) ||
               uploaderName.toLowerCase().includes(lower);
      });
    }
    if (filterType !== 'all') {
      result = result.filter(d => d.tag === filterType);
    }
    if (filterSize !== 'all') {
      const MB = 1024 * 1024;
      if (filterSize === 'small') result = result.filter(d => d.fileSizeBytes < 5 * MB);
      else if (filterSize === 'medium') result = result.filter(d => d.fileSizeBytes >= 5 * MB && d.fileSizeBytes <= 50 * MB);
      else if (filterSize === 'large') result = result.filter(d => d.fileSizeBytes > 50 * MB);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'nameAsc': return a.fileName.localeCompare(b.fileName);
        case 'nameDesc': return b.fileName.localeCompare(a.fileName);
        case 'sizeDesc': return b.fileSizeBytes - a.fileSizeBytes;
        case 'sizeAsc': return a.fileSizeBytes - b.fileSizeBytes;
        default: return 0;
      }
    });
    return result;
  }, [documents, searchTerm, filterType, filterSize, sortBy, memberMap]);

  const totalPages = Math.ceil(filteredAndSortedDocs.length / itemsPerPage);
  const paginatedDocs = filteredAndSortedDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col gap-3 pb-8 relative min-h-[500px]"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full screen Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-4 z-[100] rounded-[32px] border-4 border-primary border-dashed bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none shadow-2xl"
          >
            <div className="bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-6xl text-primary animate-bounce">cloud_upload</span>
              <h3 className="text-2xl font-bold text-primary">Thả file vào đây để tải lên</h3>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-2xl">description</span>
        <h3 className="text-xl font-bold">Tài liệu</h3>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4 mb-4 justify-between">
        {/* Toolbar */}
        <div className="flex-1 w-full max-w-3xl flex flex-col gap-3">
          {/* Search */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên file, mô tả hoặc người tải lên..." 
              value={searchTerm}
              onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl outline-none focus:border-primary transition-colors text-sm shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => {setSearchTerm(''); setCurrentPage(1);}} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          
          {/* Filters & Sort */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
             <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1.5 shadow-sm shrink-0">
               <span className="material-symbols-outlined text-[16px] text-on-surface-variant">sort</span>
               <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs font-medium bg-transparent outline-none cursor-pointer">
                 <option value="newest">Mới nhất</option>
                 <option value="oldest">Cũ nhất</option>
                 <option value="sizeDesc">Dung lượng giảm dần</option>
                 <option value="sizeAsc">Dung lượng tăng dần</option>
                 <option value="nameAsc">Tên (A-Z)</option>
                 <option value="nameDesc">Tên (Z-A)</option>
               </select>
             </div>
             <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1.5 shadow-sm shrink-0">
               <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_list</span>
               <select value={filterType} onChange={e => {setFilterType(e.target.value); setCurrentPage(1);}} className="text-xs font-medium bg-transparent outline-none cursor-pointer">
                  <option value="all">Mọi định dạng</option>
                  <option value="[Tài liệu]">Tài liệu (Word, PDF...)</option>
                  <option value="[Ảnh]">Hình ảnh</option>
                  <option value="[Video]">Video</option>
                  <option value="[Media]">Media khác</option>
                  <option value="[Khác]">Khác</option>
               </select>
             </div>
             <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1.5 shadow-sm shrink-0">
               <span className="material-symbols-outlined text-[16px] text-on-surface-variant">sd_storage</span>
               <select value={filterSize} onChange={e => {setFilterSize(e.target.value); setCurrentPage(1);}} className="text-xs font-medium bg-transparent outline-none cursor-pointer">
                  <option value="all">Mọi kích thước</option>
                  <option value="small">Nhỏ (&lt; 5MB)</option>
                  <option value="medium">Vừa (5MB - 50MB)</option>
                  <option value="large">Lớn (&gt; 50MB)</option>
               </select>
             </div>
          </div>
        </div>

        <div 
          className="w-full lg:w-[480px] bg-surface-container-lowest border-2 rounded-xl shadow-sm border-dashed flex items-center justify-between px-4 py-2 border-outline-variant/50 shrink-0 gap-4"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            </div>
            <div className="truncate flex flex-col">
              <h4 className="text-sm font-bold truncate text-on-surface">Kéo thả file vào đây</h4>
              <p className="text-[11px] text-on-surface-variant truncate">Tối đa 1GB/file</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 hover:bg-primary/90 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            Chọn file
          </button>
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container/30 shrink-0">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-6">Tên tài liệu</div>
            <div className="col-span-4">Mô tả</div>
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
            Dự án chưa có tài liệu nào
          </div>
        )}
        
        {!loading && documents.length > 0 && filteredAndSortedDocs.length === 0 && (
          <div className="p-4 flex flex-col items-center justify-center text-sm text-on-surface-variant py-12">
            <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">search_off</span>
            Không tìm thấy tài liệu phù hợp với bộ lọc
          </div>
        )}
        
        {!loading && filteredAndSortedDocs.length > 0 && (
          <div className="divide-y divide-outline-variant/20">
            {paginatedDocs.map(doc => (
              <div 
                key={doc.id} 
                className="p-4 grid grid-cols-12 items-center gap-4 hover:bg-surface-container/10 transition-colors group"
              >
                <div className="col-span-6 flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {doc.tag === '[Ảnh]' ? 'image' : doc.tag === '[Video]' ? 'movie' : doc.tag === '[Tài liệu]' ? 'description' : 'draft'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-semibold text-on-surface truncate cursor-pointer hover:text-primary transition-colors" 
                      onClick={() => handlePreview(doc)}
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant mt-1">
                      <span className="font-medium text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">{doc.tag}</span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSizeBytes)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1" title="Thời gian tải lên">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {new Date(doc.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate" title="Người tải lên">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        <span className="truncate">{memberMap[doc.uploadedByUserId] || 'Thành viên'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-span-4 text-sm text-on-surface-variant truncate pr-2">
                  {doc.description ? (
                    <span title={doc.description}>{doc.description}</span>
                  ) : (
                    <span className="italic opacity-50">Không có mô tả</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button 
                    onClick={() => setViewDocDetails(doc)} 
                    className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === doc.id ? null : doc.id)}
                      className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                    {activeDropdown === doc.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-lg overflow-hidden z-10 py-1">
                        <button onClick={() => { setActiveDropdown(null); handleDownload(doc.id, doc.fileName); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">download</span> Tải xuống
                        </button>
                        <button onClick={() => { setActiveDropdown(null); openEditModal(doc); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">edit</span> Chỉnh sửa
                        </button>
                        <button onClick={() => { setActiveDropdown(null); setDeleteDoc(doc); }} className="w-full text-left px-4 py-2 text-sm hover:bg-error/10 text-error flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">delete</span> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-outline-variant/30 bg-surface-container/10">
                <p className="text-xs text-on-surface-variant">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedDocs.length)} trong số {filteredAndSortedDocs.length} tài liệu
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <span className="text-sm font-semibold">{currentPage} / {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
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

      {/* Drop zone moved to top */}

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

      {/* View Details Modal */}
      <AnimatePresence>
        {viewDocDetails && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Thông tin chi tiết
                </h3>
                <button onClick={() => setViewDocDetails(null)} className="text-on-surface-variant hover:bg-outline-variant/20 p-2 rounded-full">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <p className="text-on-surface-variant mb-1">Tên tài liệu</p>
                    <p className="font-semibold break-words">{viewDocDetails.fileName}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Người tải lên</p>
                    <p className="font-semibold">{memberMap[viewDocDetails.uploadedByUserId] || 'Không rõ'}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Dung lượng</p>
                    <p className="font-semibold">{formatBytes(viewDocDetails.fileSizeBytes)}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Phân loại</p>
                    <p className="font-semibold">{viewDocDetails.tag}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Ngày tải lên</p>
                    <p className="font-semibold">
                      {new Date(viewDocDetails.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(viewDocDetails.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Định dạng file</p>
                    <p className="font-semibold">{viewDocDetails.fileType}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-on-surface-variant mb-1">Mô tả</p>
                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-3 rounded-xl min-h-[80px]">
                      {viewDocDetails.description ? (
                        <p className="whitespace-pre-wrap">{viewDocDetails.description}</p>
                      ) : (
                        <p className="text-on-surface-variant italic">Không có mô tả</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest">
                <button onClick={() => setViewDocDetails(null)} className="px-5 py-2 rounded-xl text-sm font-bold bg-surface-container hover:bg-outline-variant/20 transition-colors">Đóng</button>
                <button onClick={() => { setViewDocDetails(null); handlePreview(viewDocDetails); }} className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Mở tài liệu
                </button>
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
