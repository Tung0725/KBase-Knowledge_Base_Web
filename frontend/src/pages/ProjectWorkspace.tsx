import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import ProjectLayout from '../components/ProjectLayout';
import ProjectMembers from './ProjectMembers';
import ProjectDocuments from './ProjectDocuments';
import ProjectAIChat from './ProjectAIChat';

import { projectService } from '../services/projectService';
import type { ProjectOverviewResponse } from '../types/project';

import ProjectOverview from './ProjectOverview';


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
        <Route path="*" element={<Navigate to={`/projects/${projectId}`} replace />} />
      </Routes>
    </ProjectLayout>
  );
};

export default ProjectWorkspace;
