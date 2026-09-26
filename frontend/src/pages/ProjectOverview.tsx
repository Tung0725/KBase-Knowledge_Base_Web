import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService } from '../services/projectService';
import { documentService } from '../services/documentService';
import type { ProjectOverviewResponse, Document } from '../types/project';
import { toast } from 'react-hot-toast';


const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ProjectOverview: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ProjectOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Edit Project Info State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Description Expand State
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Document Actions State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [viewDocDetails, setViewDocDetails] = useState<Document | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const [data, members] = await Promise.all([
          projectService.getProjectOverview(projectId),
          projectService.getProjectMembers(projectId)
        ]);
        setOverview(data);
        
        const mMap: Record<string, string> = {};
        members.forEach(m => {
          mMap[m.userId] = m.email.split('@')[0]; // Show username part of email
        });
        setMemberMap(mMap);
      } catch (error) {
        console.error('Failed to fetch overview', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [projectId]);

  const handleEditClick = () => {
    if (overview) {
      setEditName(overview.name);
      setEditDesc(overview.description);
      setIsEditing(true);
    }
  };

  const handleSaveProjectInfo = async () => {
    if (!projectId || !overview) return;
    try {
      setIsSaving(true);
      await projectService.updateProject(projectId, {
        name: editName,
        description: editDesc,
        isPublic: overview.isPublic
      });
      setOverview({ ...overview, name: editName, description: editDesc });
      setIsEditing(false);
      toast.success('Đã cập nhật thông tin dự án');
    } catch (error) {
      toast.error('Không thể cập nhật thông tin dự án');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!projectId) return;
    try {
      const url = await documentService.getDownloadUrl(projectId, doc.id, false);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Lỗi khi tải xuống');
    }
  };

  const handleUpdateDocument = async () => {
    if (!projectId || !editDoc || !editFileName.trim()) return;
    try {
      setIsSavingDoc(true);
      await documentService.updateDocument(projectId, editDoc.id, {
        fileName: editFileName,
        description: editDescription
      });
      toast.success('Cập nhật tài liệu thành công');
      setEditDoc(null);
      const data = await projectService.getProjectOverview(projectId);
      setOverview(data);
    } catch (error) {
      toast.error('Không thể cập nhật tài liệu');
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!projectId || !deleteDoc) return;
    try {
      setIsDeletingDoc(true);
      await documentService.deleteDocument(projectId, deleteDoc.id);
      toast.success('Đã xóa tài liệu');
      setDeleteDoc(null);
      const data = await projectService.getProjectOverview(projectId);
      setOverview(data);
    } catch (error) {
      toast.error('Không thể xóa tài liệu');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleOpenDocument = async (doc: Document) => {
    if (!projectId) return;
    try {
      const url = await documentService.getDownloadUrl(projectId, doc.id, true);
      window.open(url, '_blank');
    } catch (e) {
      toast.error('Không thể mở tài liệu');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!overview) {
    return <div className="text-center p-8 text-on-surface-variant">Không thể tải dữ liệu tổng quan.</div>;
  }

  const storagePercentage = Math.min(100, (overview.usedStorageBytes / overview.storageQuotaBytes) * 100);



  const recentDocs = overview.recentDocuments || [];
  const totalPages = Math.ceil(recentDocs.length / itemsPerPage);
  const paginatedDocs = recentDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 pb-8">
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm relative group shrink-0">
        <div className="flex justify-between items-start">
          <div className="w-full flex-1 pr-40">
            <div className="flex items-center gap-3 mb-2 relative">
              <span className="material-symbols-outlined text-primary text-3xl">workspaces</span>
              {isEditing ? (
                <div className="w-full relative">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none w-full pb-1 pr-12"
                    autoFocus
                    placeholder="Nhập tên dự án..."
                  />
                  <span className="absolute right-2 bottom-2 text-[10px] text-outline font-medium">
                    {editName.length}/100
                  </span>
                </div>
              ) : (
                <h3 className="text-2xl font-bold">{overview.name}</h3>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={10}
                placeholder="Nhập mô tả dự án..."
                className="w-full bg-transparent border-b border-outline-variant/50 focus:border-b-2 focus:border-primary outline-none resize-y mt-2 pb-2 text-on-surface-variant text-base"
              ></textarea>
            ) : (
              <div className="text-on-surface-variant">
                <span className="whitespace-pre-line">
                  {!isDescExpanded && overview.description && overview.description.length > 600
                    ? overview.description.substring(0, overview.description.lastIndexOf(' ', 600)) + '...'
                    : (overview.description || 'Chưa có mô tả')}
                </span>
                {overview.description && overview.description.length > 600 && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-primary hover:underline text-sm font-semibold ml-2 inline-flex items-center"
                  >
                    {isDescExpanded ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-outline-variant/20 transition-colors"
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProjectInfo}
                  disabled={isSaving || !editName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                >
                  {isSaving ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">save</span>}
                  Lưu
                </button>
              </>
            ) : (
              <button
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-1"
                title="Sửa thông tin dự án"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>

              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">description</span>
          </div>
          <div className="shrink-0">
            <p className="text-sm font-medium text-on-surface-variant">Tổng tài liệu</p>
            <p className="text-2xl font-bold">{overview.totalDocuments}</p>
          </div>

          <div className="h-10 w-px bg-outline-variant/30 mx-2 shrink-0"></div>

          <div className="flex flex-col gap-1 w-full flex-1 justify-center">
            {[
              { key: '[Tài liệu]', label: 'Tài liệu', color: 'text-blue-600' },
              { key: '[Ảnh]', label: 'Ảnh', color: 'text-green-600' },
              { key: '[Video]', label: 'Video', color: 'text-purple-600' }
            ].map(type => {
              const count = overview.documentTypeDistribution[type.key] || 0;
              const percent = overview.totalDocuments > 0 ? Math.round((count / overview.totalDocuments) * 100) : 0;
              return (
                <div key={type.key} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${type.color}`}>{type.label}</span>
                  <span className="text-xs font-bold">{count} <span className="text-[11px] font-normal text-on-surface-variant">({percent}%)</span></span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-on-surface-variant">Dung lượng sử dụng</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {storagePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-outline-variant/30 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-on-surface-variant mt-2 text-right">
            {formatBytes(overview.usedStorageBytes)} / {formatBytes(overview.storageQuotaBytes)}
          </p>
        </div>
        
        <div 
          className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => navigate(`/projects/${projectId}/members`)}
        >
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Thành viên</p>
            <p className="text-2xl font-bold">{overview.totalMembers}</p>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {/* Recent Documents */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm flex flex-col">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">history</span>
            Tài liệu mới nhất
          </h4>
          <div className="-mx-2 px-2">
            {recentDocs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {paginatedDocs.map((doc: Document) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors border border-transparent hover:border-outline-variant/30 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">
                        {doc.tag === '[Ảnh]' ? 'image' : doc.tag === '[Video]' ? 'movie' : doc.tag === '[Tài liệu]' ? 'description' : 'draft'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors cursor-pointer" 
                        onClick={() => handleOpenDocument(doc)} 
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant mt-1.5">
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
                        <span>•</span>
                        <span className="truncate flex-1 min-w-[100px] text-on-surface-variant/80" title={doc.description || 'Không có mô tả'}>
                          {doc.description || <span className="italic opacity-50">Không có mô tả</span>}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
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
                            <button onClick={() => { setActiveDropdown(null); handleDownload(doc); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">download</span> Tải xuống
                            </button>
                            <button onClick={() => { setActiveDropdown(null); setEditDoc(doc); setEditFileName(doc.fileName); setEditDescription(doc.description || ''); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container flex items-center gap-2">
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
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">folder_off</span>
                <p>Chưa có tài liệu nào trong dự án.</p>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/30">
                <p className="text-xs text-on-surface-variant">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, recentDocs.length)} trong số {recentDocs.length} tài liệu
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
        </div>
      </div>

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
                <button onClick={() => { setViewDocDetails(null); handleOpenDocument(viewDocDetails); }} className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors">
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
                <button onClick={handleUpdateDocument} disabled={isSavingDoc || !editFileName.trim()} className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white disabled:opacity-50 flex items-center gap-2">
                  {isSavingDoc ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : 'Lưu'}
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
                <button onClick={handleDeleteDocument} disabled={isDeletingDoc} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                  {isDeletingDoc ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : 'Xóa ngay'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectOverview;
