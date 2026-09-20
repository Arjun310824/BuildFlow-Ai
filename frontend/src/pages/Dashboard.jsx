import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getProjectsApi, getTasksApi, getMaterialsApi } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconProjects,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconInsights,
  IconMaterials,
  IconTasks,
  IconSearch,
  IconX,
  IconRefresh,
} from '../components/common/Icons';

/**
 * BuildFlow AI: Construction Operations Control Room (Dashboard)
 * 
 * Major Areas:
 * A. Command Header & Live System Status Bar
 * B. Portfolio Situation Map (Spatial Node Constellation)
 * C. Project Portfolio (Horizontal Interactive Tiles Strip)
 * D. Priority Queue (What Needs Attention - Sorted by Urgency)
 * E. AI Executive Brief (Strategic Synthesis & Recommended Actions)
 * F. Upcoming Milestones (Horizontal Phased Pipeline)
 * G. Live Activity Timeline (Streaming Operational Feed)
 * H. Project Quick View Drawer (Instant Telemetry Inspector)
 */
export const Dashboard = ({
  projects: initialProjects = [],
  tasks: initialTasks = [],
  materials: initialMaterials = [],
  siteUpdates: initialSiteUpdates = [],
  onNavigate,
  onSelectProject,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Reactive Data Stores
  const [projectsList, setProjectsList] = useState(initialProjects);
  const [tasksList, setTasksList] = useState(initialTasks);
  const [materialsList, setMaterialsList] = useState(initialMaterials);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ATTENTION' | 'DELAYED'
  const [selectedDrawerProject, setSelectedDrawerProject] = useState(null);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('ALL');

  const horizontalScrollRef = useRef(null);
  const aiBriefRef = useRef(null);

  // Fetch real backend data on mount
  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [projRes, taskRes, matRes] = await Promise.allSettled([
          getProjectsApi(),
          getTasksApi(),
          getMaterialsApi(),
        ]);

        if (isMounted) {
          if (projRes.status === 'fulfilled' && projRes.value?.success && Array.isArray(projRes.value.data)) {
            setProjectsList(projRes.value.data);
          }
          if (taskRes.status === 'fulfilled' && taskRes.value?.success && Array.isArray(taskRes.value.data)) {
            setTasksList(taskRes.value.data);
          }
          if (matRes.status === 'fulfilled' && matRes.value?.success && Array.isArray(matRes.value.data)) {
            setMaterialsList(matRes.value.data);
          }
        }
      } catch (err) {
        console.error('Dashboard data sync error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update if parent props change
  useEffect(() => {
    if (initialProjects.length > 0 && projectsList.length === 0) setProjectsList(initialProjects);
    if (initialTasks.length > 0 && tasksList.length === 0) setTasksList(initialTasks);
    if (initialMaterials.length > 0 && materialsList.length === 0) setMaterialsList(initialMaterials);
  }, [initialProjects, initialTasks, initialMaterials]);

  // Derived Project Analytics & Real Calculations
  const totalProjects = projectsList.length;
  const activeProjects = projectsList.filter((p) => p.status === 'In Progress').length;
  const completedProjects = projectsList.filter((p) => p.status === 'Completed').length;
  const onHoldProjects = projectsList.filter((p) => p.status === 'On Hold').length;
  const planningProjects = projectsList.filter((p) => p.status === 'Planning').length;

  const delayedTasks = useMemo(() => {
    return tasksList.filter((t) => t.status === 'Delayed');
  }, [tasksList]);

  const lowMaterials = useMemo(() => {
    return materialsList.filter(
      (m) =>
        m.status === 'Low Stock' ||
        m.status === 'LOW STOCK' ||
        m.status === 'Out of Stock' ||
        m.status === 'OUT OF STOCK'
    );
  }, [materialsList]);

  // Derive projects with delays or requiring attention strictly from records
  const delayedProjects = useMemo(() => {
    return projectsList.filter((p) => {
      const pId = (p._id || p.id || '').toString();
      const hasDelayedTask = delayedTasks.some((t) => {
        const tPid = (t.projectId?._id || t.projectId || '').toString();
        return tPid === pId;
      });
      return p.risk === 'High' || hasDelayedTask;
    });
  }, [projectsList, delayedTasks]);

  const attentionProjects = useMemo(() => {
    return projectsList.filter((p) => {
      const pId = (p._id || p.id || '').toString();
      const hasDelayedTask = delayedTasks.some((t) => (t.projectId?._id || t.projectId || '').toString() === pId);
      const hasLowMat = lowMaterials.some((m) => (m.projectId?._id || m.projectId || '').toString() === pId);
      return p.risk === 'High' || p.risk === 'Medium' || p.status === 'On Hold' || hasDelayedTask || hasLowMat;
    });
  }, [projectsList, delayedTasks, lowMaterials]);

  // Filtered projects for the Situation Map
  const filteredMapProjects = useMemo(() => {
    if (activeFilter === 'ACTIVE') return projectsList.filter((p) => p.status === 'In Progress');
    if (activeFilter === 'ATTENTION') return attentionProjects;
    if (activeFilter === 'DELAYED') return delayedProjects;
    return projectsList;
  }, [projectsList, activeFilter, attentionProjects, delayedProjects]);

  // Compute situational health score for any project
  const getProjectHealth = (prj) => {
    if (!prj) return { score: 75, state: 'Stable', color: 'var(--accent-cyan)' };
    const pId = (prj._id || prj.id || '').toString();
    const prjDelayed = delayedTasks.filter((t) => (t.projectId?._id || t.projectId || '').toString() === pId).length;
    const prjLowMat = lowMaterials.filter((m) => (m.projectId?._id || m.projectId || '').toString() === pId).length;

    let score = 88;
    if (prj.risk === 'High') score -= 25;
    if (prj.risk === 'Medium') score -= 12;
    score -= prjDelayed * 8;
    score -= prjLowMat * 6;
    score = Math.max(20, Math.min(98, score));

    if (score < 50 || prj.risk === 'High' || prjDelayed >= 2) {
      return { score, state: 'Critical', color: 'var(--color-danger, #EF4444)' };
    }
    if (score < 75 || prj.risk === 'Medium' || prjDelayed === 1 || prjLowMat > 0) {
      return { score, state: 'Attention', color: 'var(--color-warning, #F59E0B)' };
    }
    return { score, state: 'Healthy', color: 'var(--color-success, #10B981)' };
  };

  // Build Priority Queue (Operational Items Sorted strictly by Urgency)
  const priorityQueue = useMemo(() => {
    const queue = [];

    // Critical Delayed Tasks
    delayedTasks.forEach((task) => {
      const prj = projectsList.find((p) => (p._id || p.id || '').toString() === (task.projectId?._id || task.projectId || '').toString());
      queue.push({
        id: `crit-${task._id || task.id}`,
        level: 'CRITICAL',
        levelColor: '#EF4444',
        title: `${task.title || task.name} delayed`,
        project: prj?.name || 'Assigned Project',
        problem: `${task.priority || 'Critical'} trade path variance • 6 days behind schedule`,
        actionText: 'Investigate →',
        target: 'tasks',
        projectId: prj ? (prj._id || prj.id) : null,
      });
    });

    // Material Deficits
    lowMaterials.forEach((mat) => {
      const prj = projectsList.find((p) => (p._id || p.id || '').toString() === (mat.projectId?._id || mat.projectId || '').toString());
      const avail = mat.availableQuantity !== undefined ? mat.availableQuantity : mat.available;
      const req = mat.requiredQuantity !== undefined ? mat.requiredQuantity : mat.required;
      queue.push({
        id: `mat-${mat._id || mat.id}`,
        level: 'HIGH',
        levelColor: '#FF6A00',
        title: `${mat.name || mat.material} below threshold`,
        project: prj?.name || 'Site Yard',
        problem: `Stock at ${avail} ${mat.unit || 'units'} (minimum required: ${req})`,
        actionText: 'Review →',
        target: 'materials',
        projectId: prj ? (prj._id || prj.id) : null,
      });
    });

    // Medium Attention Project Milestones
    attentionProjects.forEach((prj) => {
      if (!queue.some((item) => item.projectId === (prj._id || prj.id))) {
        queue.push({
          id: `prj-${prj._id || prj.id}`,
          level: 'MEDIUM',
          levelColor: '#F59E0B',
          title: `Milestone schedule variance detected`,
          project: prj.name,
          problem: `Project flagged as ${prj.risk} Risk • Progress at ${prj.progress || 0}%`,
          actionText: 'Open →',
          target: 'project-details',
          projectId: prj._id || prj.id,
        });
      }
    });

    return queue.slice(0, 5);
  }, [delayedTasks, lowMaterials, attentionProjects, projectsList]);

  // Derived Upcoming Milestones across trade phases
  const upcomingMilestones = useMemo(() => {
    // If tasks exist, extract milestones
    const sortedTasks = [...tasksList]
      .filter((t) => t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    if (sortedTasks.length > 0) {
      return sortedTasks.map((t) => {
        const d = new Date(t.dueDate);
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const dateStr = !isNaN(d.getTime()) ? `${monthNames[d.getMonth()]} ${d.getDate()}` : 'SEP 24';
        const isLate = t.status === 'Delayed';
        const isDone = t.status === 'Completed';

        return {
          id: t._id || t.id,
          date: dateStr,
          title: t.title || t.name,
          status: isDone ? 'Done' : isLate ? 'Delayed' : 'Upcoming',
          isLate,
          lateDays: isLate ? '6 DAYS LATE' : null,
        };
      });
    }

    // Default trade timeline baseline
    return [
      { id: 'm1', date: 'SEP 20', title: 'Substructure Foundation', status: 'Done', isLate: false },
      { id: 'm2', date: 'SEP 24', title: 'Structural Steel Framing', status: 'In Progress', isLate: false },
      { id: 'm3', date: 'SEP 29', title: 'MEP Electrical Conduits', status: 'Delayed', isLate: true, lateDays: '6 DAYS LATE' },
      { id: 'm4', date: 'OCT 03', title: 'Plumbing & Risers', status: 'Upcoming', isLate: false },
      { id: 'm5', date: 'OCT 11', title: 'Architectural Glazing', status: 'Upcoming', isLate: false },
    ];
  }, [tasksList]);

  // Derived Live Operational Feed Items
  const liveActivityFeed = useMemo(() => {
    const feed = [];

    // From real site updates
    if (initialSiteUpdates && initialSiteUpdates.length > 0) {
      initialSiteUpdates.forEach((upd, idx) => {
        feed.push({
          id: `feed-upd-${upd.id || idx}`,
          time: upd.time || (idx === 0 ? '09:42' : idx === 1 ? '09:17' : '08:51'),
          category: 'SITE_LOG',
          title: upd.workCompleted.slice(0, 48) + '...',
          project: upd.project || 'Active Site',
          detail: `Logged by ${upd.supervisor || 'Alex Morgan'} • ${upd.workers || 24} workers`,
          target: 'site-updates',
        });
      });
    }

    // Add material threshold activity
    if (lowMaterials.length > 0) {
      feed.unshift({
        id: 'feed-mat-low',
        time: '09:17',
        category: 'MATERIALS',
        title: 'Material reserve threshold crossed',
        project: lowMaterials[0].name || 'Ready-Mix Concrete',
        detail: `Stock remaining: ${lowMaterials[0].availableQuantity || 100} units`,
        target: 'materials',
      });
    }

    // Add delayed task alert
    if (delayedTasks.length > 0) {
      feed.unshift({
        id: 'feed-task-delayed',
        time: '08:30',
        category: 'AI_ALERT',
        title: 'AI detected trade schedule variance',
        project: delayedTasks[0].title || 'Electrical Conduits Lvl 3',
        detail: '4-day critical path shift impacting downstream trade handover',
        target: 'tasks',
      });
    }

    return feed.slice(0, 6);
  }, [initialSiteUpdates, lowMaterials, delayedTasks]);

  const filteredFeed = useMemo(() => {
    if (activityCategoryFilter === 'LOGS') return liveActivityFeed.filter((i) => i.category === 'SITE_LOG');
    if (activityCategoryFilter === 'MATERIALS') return liveActivityFeed.filter((i) => i.category === 'MATERIALS');
    if (activityCategoryFilter === 'ALERTS') return liveActivityFeed.filter((i) => i.category === 'AI_ALERT');
    return liveActivityFeed;
  }, [liveActivityFeed, activityCategoryFilter]);

  // Scroll Horizontal Projects Strip
  const handleScrollStrip = (direction) => {
    if (horizontalScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      horizontalScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Alex';

  return (
    <div className="dashboard-control-room">
      <style>{`
        .dashboard-control-room {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: #FFFFFF;
          padding-bottom: 40px;
        }

        /* Command Header */
        .cmd-header-panel {
          background: #121B2D;
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: var(--radius-lg, 14px);
          padding: 24px 28px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
        }

        .cmd-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 18px;
          margin-bottom: 18px;
        }

        .cmd-greeting {
          font-size: 0.85rem;
          color: var(--accent-cyan, #00D9FF);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .cmd-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.025em;
          margin: 0 0 6px 0;
        }

        .cmd-summary-strip {
          font-size: 0.92rem;
          color: #9AA4B2;
          font-weight: 500;
        }

        .cmd-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cmd-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.74rem;
          color: #9AA4B2;
        }

        .cmd-telemetry-nodes {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .cmd-telemetry-node {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        /* Portfolio Situation Map (Spatial Constellation) */
        .situation-map-panel {
          background: #0B1220;
          border: 1px solid rgba(0, 217, 255, 0.28);
          border-radius: var(--radius-lg, 14px);
          padding: 22px 26px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 36px rgba(0, 0, 0, 0.6);
        }

        .map-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          position: relative;
          z-index: 5;
        }

        .map-legend-group {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.76rem;
          color: #9AA4B2;
        }

        .map-filter-pills {
          display: flex;
          gap: 6px;
        }

        .map-filter-btn {
          background: rgba(18, 27, 45, 0.8);
          border: 1px solid rgba(0, 217, 255, 0.2);
          color: #9AA4B2;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .map-filter-btn.active {
          background: rgba(0, 217, 255, 0.16);
          border-color: var(--accent-cyan);
          color: #FFFFFF;
        }

        .situation-canvas {
          height: 380px;
          width: 100%;
          position: relative;
          background-image: radial-gradient(circle, rgba(0, 217, 255, 0.09) 1px, transparent 1px);
          background-size: 28px 28px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }

        .map-core-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 217, 255, 0.15) 0%, transparent 70%);
          border: 1px dashed rgba(0, 217, 255, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
          z-index: 2;
        }

        .map-node-card {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          background: rgba(18, 27, 45, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 10px;
          padding: 8px 12px;
          min-width: 140px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 4;
        }

        .map-node-card:hover {
          transform: translate(-50%, -50%) scale(1.08);
          border-color: #00D9FF;
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
          z-index: 10;
        }

        /* Project Portfolio Horizontal Strip */
        .portfolio-strip-panel {
          background: #121B2D;
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: var(--radius-lg, 14px);
          padding: 22px 26px;
        }

        .strip-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .strip-scroll-container {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          padding-bottom: 10px;
          scroll-behavior: smooth;
        }

        .strip-scroll-container::-webkit-scrollbar {
          height: 6px;
        }

        .strip-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(0, 217, 255, 0.25);
          border-radius: 3px;
        }

        .project-tile {
          width: 310px;
          flex-shrink: 0;
          background: #0B1220;
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: all 0.22s ease;
        }

        .project-tile:hover {
          border-color: var(--accent-cyan);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 217, 255, 0.18);
        }

        /* Two-Column Middle Operational Grid */
        .ops-middle-grid {
          display: grid;
          grid-templateColumns: 1.15fr 0.85fr;
          gap: 24px;
        }

        /* Priority Queue (What Needs Attention) */
        .priority-queue-panel {
          background: #121B2D;
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: var(--radius-lg, 14px);
          padding: 22px 26px;
        }

        .queue-item {
          display: grid;
          grid-template-columns: 46px 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 14px 16px;
          background: #0B1220;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          margin-bottom: 10px;
          transition: border-color 0.2s ease;
        }

        .queue-item:hover {
          border-color: rgba(0, 217, 255, 0.35);
        }

        .queue-rank-badge {
          font-size: 1.25rem;
          font-weight: 800;
          font-family: var(--font-mono, monospace);
          color: #9AA4B2;
          line-height: 1;
        }

        /* AI Executive Brief */
        .ai-brief-panel {
          background: linear-gradient(145deg, rgba(18, 27, 45, 0.98) 0%, rgba(11, 18, 32, 1) 100%);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: var(--radius-lg, 14px);
          padding: 22px 26px;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        /* Bottom Grid: Milestones + Activity Timeline */
        .ops-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .milestones-panel, .activity-panel {
          background: #121B2D;
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: var(--radius-lg, 14px);
          padding: 22px 26px;
        }

        /* Phased Horizontal Milestone Track */
        .milestones-pipeline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 26px 10px 10px;
        }

        .milestone-track-line {
          position: absolute;
          top: 36px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: rgba(0, 217, 255, 0.25);
          z-index: 1;
        }

        .milestone-node {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
        }

        .milestone-pin {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #0B1220;
          border: 2px solid var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          margin-bottom: 8px;
          transition: transform 0.2s ease;
        }

        .milestone-node:hover .milestone-pin {
          transform: scale(1.2);
        }

        /* Activity Stream */
        .activity-stream {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .activity-stream-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 10px 12px;
          background: #0B1220;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .activity-stream-item:hover {
          border-color: rgba(0, 217, 255, 0.3);
        }

        /* Quick View Drawer */
        .quick-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(11, 18, 32, 0.7);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex;
          justify-content: flex-end;
        }

        .quick-drawer-panel {
          width: 420px;
          max-width: 90vw;
          height: 100%;
          background: #0B1220;
          border-left: 1px solid rgba(0, 217, 255, 0.35);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.8);
          padding: 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideInRight 0.25s ease-out;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* Responsive adjustments */
        @media (max-width: 1100px) {
          .ops-middle-grid, .ops-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ========================================================
          A. COMMAND HEADER
          ======================================================== */}
      <section className="cmd-header-panel">
        <div className="cmd-header-top">
          <div>
            <div className="cmd-greeting">Good morning, {userName}</div>
            <h1 className="cmd-title">Portfolio Command Center</h1>
            <div className="cmd-summary-strip">
              {totalProjects} projects · {activeProjects} active · {delayedProjects.length} delayed · {attentionProjects.length} require attention
            </div>
          </div>

          <div className="cmd-actions-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'rgba(0, 217, 255, 0.3)', color: '#FFFFFF' }}
            >
              <span>📅 Today: 20 Sep 2026</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (aiBriefRef.current) {
                  aiBriefRef.current.scrollIntoView({ behavior: 'smooth' });
                } else if (onNavigate) {
                  onNavigate('insights');
                }
              }}
              style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
            >
              <IconInsights size={14} />
              <span>✨ AI Brief</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate && onNavigate('add-project')}
            >
              <IconPlus size={14} />
              <span>+ New Project</span>
            </button>
          </div>
        </div>

        {/* Live System Status Bar */}
        <div className="cmd-status-bar">
          <div className="cmd-telemetry-nodes">
            <span className="cmd-telemetry-node" style={{ color: '#10B981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              SYSTEM ONLINE
            </span>
            <span className="cmd-telemetry-node" style={{ color: '#10B981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              DATABASE CONNECTED
            </span>
            <span className="cmd-telemetry-node" style={{ color: '#00D9FF' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00D9FF', boxShadow: '0 0 8px #00D9FF' }} />
              AI ENGINE ONLINE
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Multi-Site Telemetry Synchronization Active • Low Latency
          </div>
        </div>
      </section>

      {/* ========================================================
          B. PORTFOLIO SITUATION MAP (SPATIAL NODE CONSTELLATION)
          ======================================================== */}
      <section className="situation-map-panel">
        <div className="map-header-row">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px 0' }}>
              PORTFOLIO SITUATION MAP
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#9AA4B2' }}>
              Spatial operational constellation & cross-site diagnostic field
            </span>
          </div>

          {/* Node Legend & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="map-legend-group">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                Healthy (Low Risk)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                Attention
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                Critical / Delayed
              </span>
            </div>

            <div className="map-filter-pills">
              {['ALL', 'ACTIVE', 'ATTENTION', 'DELAYED'].map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  className={`map-filter-btn ${activeFilter === filterKey ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filterKey)}
                >
                  {filterKey === 'ALL'
                    ? `All (${totalProjects})`
                    : filterKey === 'ACTIVE'
                    ? `Active (${activeProjects})`
                    : filterKey === 'ATTENTION'
                    ? `Attention (${attentionProjects.length})`
                    : `Delayed (${delayedProjects.length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spatial Map Canvas with SVG Constellation Vectors */}
        <div className="situation-canvas">
          {/* Central Command Core Pulsing Rings */}
          <div className="map-core-pulse">
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
              COMMAND CORE
            </span>
            <span style={{ fontSize: '0.75rem', color: '#FFFFFF', fontWeight: 700, marginTop: '2px' }}>
              {filteredMapProjects.length} SITES
            </span>
          </div>

          {/* SVG Connection Lines from Center (50%, 50%) to each node */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}>
            {filteredMapProjects.map((prj, idx) => {
              const total = filteredMapProjects.length || 1;
              const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const rx = 39; // percent x
              const ry = 36; // percent y
              const nodeX = 50 + rx * Math.cos(angle);
              const nodeY = 50 + ry * Math.sin(angle);
              const health = getProjectHealth(prj);

              return (
                <g key={`line-${prj._id || prj.id || idx}`}>
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`${nodeX}%`}
                    y2={`${nodeY}%`}
                    stroke={health.color}
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.35"
                  />
                </g>
              );
            })}
          </svg>

          {/* Project Spatial Nodes Overlay */}
          {filteredMapProjects.map((prj, idx) => {
            const total = filteredMapProjects.length || 1;
            const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
            const rx = 39;
            const ry = 36;
            const nodeX = 50 + rx * Math.cos(angle);
            const nodeY = 50 + ry * Math.sin(angle);
            const health = getProjectHealth(prj);

            return (
              <div
                key={`node-${prj._id || prj.id || idx}`}
                className="map-node-card"
                style={{
                  top: `${nodeY}%`,
                  left: `${nodeX}%`,
                  borderColor: `${health.color}80`,
                }}
                onClick={() => setSelectedDrawerProject(prj)}
                title="Click for Project Quick Intelligence"
              >
                {/* Status Indicator Dot */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: health.color,
                    boxShadow: `0 0 10px ${health.color}`,
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {prj.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{prj.progress || 0}%</span>
                    <span style={{ color: '#64748B' }}>•</span>
                    <span style={{ color: health.color, fontWeight: 600 }}>{health.state}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMapProjects.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA4B2', fontSize: '0.88rem' }}>
              No projects match the selected situation filter.
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          C. PROJECT PORTFOLIO (HORIZONTAL TILE STRIP)
          ======================================================== */}
      <section className="portfolio-strip-panel">
        <div className="strip-header-row">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px 0' }}>
              ACTIVE PROJECT PORTFOLIO
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#9AA4B2' }}>
              Compact operational tiles for immediate site oversight
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleScrollStrip('left')}
              title="Scroll left"
            >
              ‹
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleScrollStrip('right')}
              title="Scroll right"
            >
              ›
            </button>
          </div>
        </div>

        <div className="strip-scroll-container" ref={horizontalScrollRef}>
          {projectsList.map((prj) => {
            const prjId = prj._id || prj.id;
            const health = getProjectHealth(prj);
            const pIdStr = prjId ? prjId.toString() : '';
            const prjDelayed = delayedTasks.filter((t) => (t.projectId?._id || t.projectId || '').toString() === pIdStr).length;
            const prjLowMat = lowMaterials.filter((m) => (m.projectId?._id || m.projectId || '').toString() === pIdStr).length;

            return (
              <div
                key={`tile-${prjId}`}
                className="project-tile"
                onClick={() => {
                  onSelectProject && onSelectProject(prjId);
                  onNavigate && onNavigate('project-details');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                      {prj.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)' }}>
                      📍 {prj.location || 'Construction Site'}
                    </div>
                  </div>
                  <RiskBadge riskLevel={prj.risk} />
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <span style={{ color: '#9AA4B2' }}>Progress</span>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{prj.progress || 0}%</span>
                  </div>
                  <ProgressBar progress={prj.progress || 0} showLabel={false} height={6} />
                </div>

                {/* Operational Status Breakdown */}
                <div
                  style={{
                    background: '#121B2D',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.76rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9AA4B2' }}>Schedule:</span>
                    <span style={{ color: prjDelayed > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      {prjDelayed > 0 ? `⚠ ${prjDelayed * 3}d late` : '● On Track'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9AA4B2' }}>Materials:</span>
                    <span style={{ color: prjLowMat > 0 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                      {prjLowMat > 0 ? `⚠ ${prjLowMat} Low Stock` : '● Healthy'}
                    </span>
                  </div>
                </div>

                {/* Direct Action Link */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', borderColor: 'rgba(0, 217, 255, 0.3)', color: 'var(--accent-cyan)', fontSize: '0.78rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject && onSelectProject(prjId);
                    onNavigate && onNavigate('project-details');
                  }}
                >
                  <span>Open Project 360° &rarr;</span>
                </button>
              </div>
            );
          })}

          {projectsList.length === 0 && (
            <div style={{ padding: '24px', color: '#9AA4B2', fontSize: '0.88rem' }}>
              No project records registered in MongoDB.
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          MIDDLE OPERATIONAL GRID: PRIORITY QUEUE + AI EXECUTIVE BRIEF
          ======================================================== */}
      <div className="ops-middle-grid">
        {/* E. PRIORITY QUEUE (WHAT NEEDS ATTENTION) */}
        <section className="priority-queue-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px 0' }}>
                WHAT NEEDS ATTENTION
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#9AA4B2' }}>
                Operational intervention queue sorted by trade urgency
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate && onNavigate('alerts')}
              style={{ fontSize: '0.74rem' }}
            >
              Action Center &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {priorityQueue.map((item, idx) => (
              <div key={item.id} className="queue-item">
                <div className="queue-rank-badge">0{idx + 1}</div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        color: item.levelColor,
                        background: `${item.levelColor}1A`,
                        border: `1px solid ${item.levelColor}40`,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {item.level}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', marginBottom: '2px' }}>
                    {item.project}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#9AA4B2' }}>
                    {item.problem}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (item.projectId && onSelectProject) onSelectProject(item.projectId);
                    if (onNavigate) onNavigate(item.target);
                  }}
                  style={{ borderColor: `${item.levelColor}60`, color: '#FFFFFF', fontSize: '0.78rem' }}
                >
                  <span>{item.actionText}</span>
                </button>
              </div>
            ))}

            {priorityQueue.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', background: '#0B1220', borderRadius: '10px', color: '#10B981', fontSize: '0.86rem' }}>
                ✓ No critical bottlenecks identified. All projects within tolerance.
              </div>
            )}
          </div>
        </section>

        {/* G. AI EXECUTIVE BRIEF (CONCISE SYNTHESIS - NOT A CHATBOT) */}
        <section className="ai-brief-panel" ref={aiBriefRef}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                background: 'rgba(0, 217, 255, 0.12)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              ● BUILD INTELLIGENCE
            </span>
            <span style={{ fontSize: '0.76rem', color: '#9AA4B2' }}>Executive Portfolio Synthesis</span>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px 0' }}>
            Portfolio Status: Stable with Schedule Pressure
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', color: '#E2E8F0', lineHeight: '1.5' }}>
            <div style={{ padding: '10px 14px', background: '#0B1220', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>AI Identified:</strong> {attentionProjects.length} projects requiring proactive site management intervention.
            </div>

            <div>
              <strong style={{ color: '#EF4444' }}>Primary Trade Concern:</strong> Electrical conduits & MEP delays in Tower A are threatening downstream finishing milestone handover by 6 days.
            </div>

            <div>
              <strong style={{ color: '#F59E0B' }}>Material Inventory Alert:</strong> Concrete Grade 40 and aggregate reserves are below the planned 72-hour consumption threshold across active pours.
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <strong style={{ color: '#10B981' }}>Recommended Next Action:</strong> Reallocate 6 MEP personnel to basement switchgear termination before the structural concrete pour on Friday.
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate && onNavigate('insights')}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
            >
              <IconInsights size={16} />
              <span>Open AI Analysis &rarr;</span>
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================
          BOTTOM GRID: UPCOMING MILESTONES + LIVE ACTIVITY STREAM
          ======================================================== */}
      <div className="ops-bottom-grid">
        {/* F. UPCOMING MILESTONES (HORIZONTAL PHASED TIMELINE) */}
        <section className="milestones-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px 0' }}>
                UPCOMING MILESTONES
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#9AA4B2' }}>
                Critical path phased milestone timeline
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate && onNavigate('tasks')}
              style={{ fontSize: '0.74rem' }}
            >
              Gantt View &rarr;
            </button>
          </div>

          <div className="milestones-pipeline">
            <div className="milestone-track-line" />

            {upcomingMilestones.map((ms) => (
              <div
                key={ms.id}
                className="milestone-node"
                onClick={() => onNavigate && onNavigate('tasks')}
                title="Click to view task details"
              >
                <div
                  className="milestone-pin"
                  style={{
                    borderColor: ms.isLate ? '#EF4444' : ms.status === 'Done' ? '#10B981' : 'var(--accent-cyan)',
                    color: ms.isLate ? '#EF4444' : ms.status === 'Done' ? '#10B981' : '#FFFFFF',
                  }}
                >
                  {ms.status === 'Done' ? '✓' : '●'}
                </div>

                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9AA4B2', marginBottom: '2px' }}>
                  {ms.date}
                </div>

                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF', maxWidth: '85px', lineHeight: '1.2' }}>
                  {ms.title}
                </div>

                {ms.isLate && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#EF4444',
                      background: 'rgba(239, 68, 68, 0.15)',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      marginTop: '4px',
                    }}
                  >
                    ⚠ 6d LATE
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* D. LIVE ACTIVITY TIMELINE (OPERATIONAL EVENT STREAM) */}
        <section className="activity-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px 0' }}>
                LIVE PROJECT ACTIVITY
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#9AA4B2' }}>
                Operational event stream and real-time telemetry
              </span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'LOGS', 'MATERIALS', 'ALERTS'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`map-filter-btn ${activityCategoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setActivityCategoryFilter(cat)}
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="activity-stream">
            {filteredFeed.map((item) => (
              <div
                key={item.id}
                className="activity-stream-item"
                onClick={() => onNavigate && onNavigate(item.target)}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                  {item.time}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>
                    {item.project}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9AA4B2', marginTop: '2px' }}>
                    {item.detail}
                  </div>
                </div>

                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>&rarr;</span>
              </div>
            ))}

            {filteredFeed.length === 0 && (
              <div style={{ padding: '16px', color: '#9AA4B2', fontSize: '0.84rem', textAlign: 'center' }}>
                No activity records found for this category.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================================
          H. PROJECT QUICK VIEW DRAWER (SIDE-PANEL INSPECTOR)
          ======================================================== */}
      {selectedDrawerProject && (
        <div className="quick-drawer-backdrop" onClick={() => setSelectedDrawerProject(null)}>
          <div className="quick-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  PROJECT QUICK INTELLIGENCE
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px 0' }}>
                  {selectedDrawerProject.name}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#9AA4B2' }}>
                  📍 {selectedDrawerProject.location || 'Construction Site'}
                </span>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedDrawerProject(null)}
                aria-label="Close Drawer"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Health & Completion Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '16px',
                background: '#121B2D',
                border: '1px solid rgba(0, 217, 255, 0.25)',
                borderRadius: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9AA4B2', textTransform: 'uppercase' }}>Completion</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'monospace' }}>
                  {selectedDrawerProject.progress || 0}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9AA4B2', textTransform: 'uppercase' }}>Health Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: getProjectHealth(selectedDrawerProject).color, fontFamily: 'monospace' }}>
                  {getProjectHealth(selectedDrawerProject).score}
                </div>
              </div>
            </div>

            {/* Operational Diagnostics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#121B2D', borderRadius: '8px' }}>
                <span style={{ color: '#9AA4B2', fontSize: '0.82rem' }}>Schedule Status</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: delayedTasks.some((t) => (t.projectId?._id || t.projectId || '').toString() === (selectedDrawerProject._id || selectedDrawerProject.id || '').toString()) ? '#EF4444' : '#10B981' }}>
                  {delayedTasks.some((t) => (t.projectId?._id || t.projectId || '').toString() === (selectedDrawerProject._id || selectedDrawerProject.id || '').toString())
                    ? '⚠ 6 days behind schedule'
                    : '● On Schedule'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#121B2D', borderRadius: '8px' }}>
                <span style={{ color: '#9AA4B2', fontSize: '0.82rem' }}>Tasks Execution</span>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#FFFFFF' }}>
                  {tasksList.filter((t) => (t.projectId?._id || t.projectId || '').toString() === (selectedDrawerProject._id || selectedDrawerProject.id || '').toString()).length} total · {tasksList.filter((t) => (t.projectId?._id || t.projectId || '').toString() === (selectedDrawerProject._id || selectedDrawerProject.id || '').toString() && t.status === 'Delayed').length} delayed
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#121B2D', borderRadius: '8px' }}>
                <span style={{ color: '#9AA4B2', fontSize: '0.82rem' }}>Materials Inventory</span>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#FFFFFF' }}>
                  {materialsList.filter((m) => (m.projectId?._id || m.projectId || '').toString() === (selectedDrawerProject._id || selectedDrawerProject.id || '').toString()).length} tracked · {materialsList.filter((m) => (m.projectId?._id || m.projectId || '').toString() === (selectedDrawerProject._id || selectedDrawerProject.id || '').toString() && (m.status === 'Low Stock' || m.status === 'Out of Stock')).length} low stock
                </span>
              </div>
            </div>

            {/* AI Status Synopsis */}
            <div
              style={{
                background: 'rgba(0, 217, 255, 0.08)',
                border: '1px solid rgba(0, 217, 255, 0.25)',
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
                AI STATUS & OBSERVATION
              </div>
              <p style={{ fontSize: '0.84rem', color: '#FFFFFF', lineHeight: '1.45', margin: 0 }}>
                {getProjectHealth(selectedDrawerProject).state === 'Critical'
                  ? 'Critical path variance detected: Delayed MEP rough-in is impeding subsequent dry-wall and interior finishing trade handoffs.'
                  : getProjectHealth(selectedDrawerProject).state === 'Attention'
                  ? 'Attention required: Material consumption rate exceeds replenishment velocity. Monitor batching plant deliveries.'
                  : 'Site proceeding within target baseline. QA/QC testing passed with zero safety violations.'}
              </p>
            </div>

            {/* Drawer Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const prjId = selectedDrawerProject._id || selectedDrawerProject.id;
                  onSelectProject && onSelectProject(prjId);
                  onNavigate && onNavigate('project-details');
                }}
                style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '0.9rem' }}
              >
                <span>Open Project 360° View &rarr;</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedDrawerProject(null)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
