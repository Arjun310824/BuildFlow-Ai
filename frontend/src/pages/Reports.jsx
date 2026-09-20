import React, { useState } from 'react';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconReports,
  IconDownload,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconAlertTriangle,
} from '../components/common/Icons';

export const Reports = ({
  projects = [],
  tasks = [],
  materials = [],
  onExportReport,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('Quarterly (Q3 2026)');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Reports & Analytics</h1>
          <p>Portfolio velocity benchmarks, critical delay root causes, material run rates, and fiscal variances.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onExportReport('PDF')}
          >
            <IconDownload size={15} />
            <span>Export PDF</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onExportReport('CSV')}
          >
            <IconDownload size={15} />
            <span>Export CSV</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onExportReport('Generated')}
          >
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Reporting Period:</span>
          {['This Month', 'Quarterly (Q3 2026)', 'Year to Date', 'Custom'].map((period) => (
            <button
              key={period}
              className={`btn btn-sm ${selectedTimeframe === period ? 'btn-dark' : 'btn-secondary'}`}
              onClick={() => setSelectedTimeframe(period)}
            >
              {period}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Data calculated as of 20 Sep 2026
        </div>
      </div>

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Section 1: Project Progress Velocity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Project Progress & Milestone Delivery</div>
              <div className="card-subtitle">Planned baseline schedule vs actual field completion</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {projects.slice(0, 4).map((p) => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: p.status === 'Delayed' ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {p.progress}% ({p.status})
                  </span>
                </div>
                <ProgressBar
                  progress={p.progress}
                  variant={p.status === 'Delayed' ? 'danger' : p.status === 'At Risk' ? 'warning' : 'success'}
                  showLabel={false}
                  height={8}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Task Completion Burn-Up */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Task Completion Distribution</div>
              <div className="card-subtitle">Execution status across subcontracts</div>
            </div>
          </div>

          {/* SVG Task Status Donut Representation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 0' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="130" height="130" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="3.8"
                  strokeDasharray="48, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-info)"
                  strokeWidth="3.8"
                  strokeDasharray="28, 100"
                  strokeDashoffset="-48"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-danger)"
                  strokeWidth="3.8"
                  strokeDasharray="24, 100"
                  strokeDashoffset="-76"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {tasks.length}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tasks</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }} />
                <span>Completed (48%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-info)' }} />
                <span>In Progress (28%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-danger)' }} />
                <span>Delayed (24%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid: Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Section 3: Material Consumption */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Material Consumption</div>
              <div className="card-subtitle">Burn rate against procurement plan</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span>Portland Cement</span>
                <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>84% Burned (Low)</span>
              </div>
              <ProgressBar progress={84} variant="danger" showLabel={false} height={6} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span>Steel Rebar Grade 60</span>
                <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>68% Burned</span>
              </div>
              <ProgressBar progress={68} variant="warning" showLabel={false} height={6} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span>Ready-Mix Concrete</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>52% Burned (On Track)</span>
              </div>
              <ProgressBar progress={52} variant="success" showLabel={false} height={6} />
            </div>
          </div>
        </div>

        {/* Section 4: Project Delays Root Causes */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Delay Root Cause Analysis</div>
              <div className="card-subtitle">Identified schedule friction sources</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span>Weather / Rain Delays</span>
              <strong>38% (14 shifts)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span>Vendor Inventory Stockout</span>
              <strong>29% (11 shifts)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span>Inspection Scheduling Lag</span>
              <strong>21% (8 shifts)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span>Design / Blueprint Revisions</span>
              <strong>12% (4 shifts)</strong>
            </div>
          </div>
        </div>

        {/* Section 5: Budget Overview */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Budget Overview</div>
              <div className="card-subtitle">Cost performance & contingency burn</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Total Portfolio Allocation</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>$125,500,000</div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span>Funds Disbursed ($77.4M)</span>
                <span style={{ fontWeight: 600 }}>61.6%</span>
              </div>
              <ProgressBar progress={62} showLabel={false} height={6} />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconCheck size={14} />
              <span>Contingency reserve remains 86% intact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
