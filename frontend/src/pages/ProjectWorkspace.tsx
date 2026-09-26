import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import ProjectMembers from './ProjectMembers';
import ProjectDocuments from './ProjectDocuments';
import ProjectAIChat from './ProjectAIChat';
import { motion } from 'framer-motion';
import { projectService } from '../services/projectService';
import type { ProjectOverviewResponse } from '../types/project';

import ProjectOverview from './ProjectOverview';

const ProjectSettings = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-error">
        <span className="material-symbols-outlined">warning</span>
        Cài đặt nguy hiểm
      </h3>
      <p className="text-on-surface-variant mb-4 text-sm">Chỉ chủ sở hữu dự án mới có quyền truy cập khu vực này.</p>
    </div>
  </motion.div>
);

const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectOverview, setProjectOverview] = useState<ProjectOverviewResponse | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!projectId) return;
      try {
        const data = await projectService.getProjectOverview(projectId);
        setProjectOverview(data);
      } catch (error) {
        console.error('Failed to fetch project overview in workspace', error);
      }
    };
    fetchOverview();
  }, [projectId]);

  return (
    <ProjectLayout 
      projectName={projectOverview?.name || 'Đang tải...'} 
      overview={projectOverview}
    >
      <Routes>
        <Route path="/" element={<ProjectOverview />} />
        <Route path="/chat" element={<ProjectAIChat />} />
        <Route path="/documents" element={<ProjectDocuments />} />
        <Route path="/members" element={<ProjectMembers />} />
        <Route path="/settings" element={<ProjectSettings />} />
        <Route path="*" element={<Navigate to={`/projects/${projectId}`} replace />} />
      </Routes>
    </ProjectLayout>
  );
};

export default ProjectWorkspace;
