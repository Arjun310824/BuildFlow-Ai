import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconNetwork,
  IconShieldCheck,
  IconHandshake,
  IconBuilding,
  IconSearch,
  IconCheck,
  IconClock,
  IconFilePdf,
  IconMaterials,
  IconDocuments,
} from '../components/common/Icons';
import {
  getMyOrganizationApi,
  getOrganizationsApi,
  getBusinessConnectionsApi,
  createBusinessConnectionApi,
  acceptBusinessConnectionApi,
  rejectBusinessConnectionApi,
  suspendBusinessConnectionApi,
  getConnectionSharedDataApi,
  getConnectionAuditLogsApi,
  getBusinessTransactionsApi,
  getBusinessTransactionByIdApi,
  createBusinessTransactionApi,
  acceptBusinessTransactionApi,
  rejectBusinessTransactionApi,
  startBusinessTransactionApi,
  completeBusinessTransactionApi,
  cancelBusinessTransactionApi,
  getProjectsApi,
} from '../services/api';

export const BusinessNetwork = ({ onTriggerToast = () => {} }) => {
  const { t } = useTranslation();

  // Primary Tabs
  // 'connected' | 'pending' | 'transactions' | 'directory' | 'audit'
  const [activeTab, setActiveTab] = useState('connected');

  // Network State
  const [myOrg, setMyOrg] = useState(null);
  const [connections, setConnections] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Transaction Filters: 'ALL' | 'my_sent' | 'incoming' | 'active' | 'completed'
  const [transactionFilter, setTransactionFilter] = useState('ALL');

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSharedDataModal, setShowSharedDataModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [sharedData, setSharedData] = useState(null);
  const [loadingSharedData, setLoadingSharedData] = useState(false);

  // New Business Request Modal State (Task 21)
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [requestStep, setRequestStep] = useState(1);
  const [targetPartnerConnId, setTargetPartnerConnId] = useState('');
  const [requestType, setRequestType] = useState('Material Request');
  const [requestTitle, setRequestTitle] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState(500);
  const [unit, setUnit] = useState('Bags');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [requestedDate, setRequestedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Shared Business Workspace Modal State (Task 21)
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  // New Connection Form State (Task 20)
  const [targetOrgId, setTargetOrgId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([
    'MATERIAL_ORDERS',
    'DELIVERY_STATUS',
    'DOCUMENTS',
  ]);
  const [connectionPurpose, setConnectionPurpose] = useState(
    'B2B construction operations and material dispatch collaboration'
  );
  const [isSubmittingConnection, setIsSubmittingConnection] = useState(false);

  // Load all initial network data
  const loadNetworkData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [myOrgRes, connsRes, orgsRes, logsRes, transRes, projRes] = await Promise.allSettled([
        getMyOrganizationApi(),
        getBusinessConnectionsApi(),
        getOrganizationsApi(),
        getConnectionAuditLogsApi(),
        getBusinessTransactionsApi(),
        getProjectsApi(),
      ]);

      if (myOrgRes.status === 'fulfilled' && myOrgRes.value?.success) {
        setMyOrg(myOrgRes.value.data);
      }

      if (connsRes.status === 'fulfilled' && connsRes.value?.success) {
        setConnections(connsRes.value.data || []);
      }

      if (orgsRes.status === 'fulfilled' && orgsRes.value?.success) {
        setOrganizations(orgsRes.value.data || []);
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.success) {
        setAuditLogs(logsRes.value.data || []);
      }

      if (transRes.status === 'fulfilled' && transRes.value?.success) {
        setTransactions(transRes.value.data || []);
      }

      if (projRes.status === 'fulfilled' && projRes.value?.success) {
        setProjects(projRes.value.data || []);
      }
    } catch (err) {
      console.error('Error loading Business Network data:', err);
      onTriggerToast('Failed to load business network details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onTriggerToast]);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  // Derived connection lists
  const connectedPartners = connections.filter((c) => c.status === 'Accepted');
  const pendingRequests = connections.filter((c) => c.status === 'Pending');

  const myOrgIdStr = myOrg?._id?.toString() || myOrg?.id?.toString() || '';
  const incomingPending = pendingRequests.filter(
    (c) =>
      (c.receivingOrganization?._id?.toString() || c.receivingOrganization?.id?.toString()) ===
      myOrgIdStr
  );
  const outgoingPending = pendingRequests.filter(
    (c) =>
      (c.requestingOrganization?._id?.toString() || c.requestingOrganization?.id?.toString()) ===
      myOrgIdStr
  );

  // Filtered transactions list
  const filteredTransactions = transactions.filter((t) => {
    const reqOrgId = t.requesterOrganization?._id?.toString() || t.requesterOrganization?.id?.toString() || '';
    const recOrgId = t.recipientOrganization?._id?.toString() || t.recipientOrganization?.id?.toString() || '';

    if (transactionFilter === 'my_sent') {
      return reqOrgId === myOrgIdStr;
    }
    if (transactionFilter === 'incoming') {
      return recOrgId === myOrgIdStr;
    }
    if (transactionFilter === 'active') {
      return ['Sent', 'Viewed', 'Accepted', 'In Progress'].includes(t.status);
    }
    if (transactionFilter === 'completed') {
      return t.status === 'Completed';
    }
    return true; // 'ALL'
  });

  // Incoming transaction requests requiring attention
  const incomingTxRequests = transactions.filter((t) => {
    const recOrgId = t.recipientOrganization?._id?.toString() || t.recipientOrganization?.id?.toString() || '';
    return recOrgId === myOrgIdStr && ['Sent', 'Viewed'].includes(t.status);
  });

  // Handle Accept Connection
  const handleAcceptConnection = async (connectionId) => {
    try {
      const res = await acceptBusinessConnectionApi(connectionId);
      if (res.success) {
        onTriggerToast('Business connection accepted! Data sharing is now active.', 'success');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to accept connection', 'error');
    }
  };

  // Handle Reject Connection
  const handleRejectConnection = async (connectionId) => {
    try {
      const res = await rejectBusinessConnectionApi(connectionId, 'Declined by organization admin');
      if (res.success) {
        onTriggerToast('Connection request rejected.', 'info');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to reject connection', 'error');
    }
  };

  // Handle Suspend Connection
  const handleSuspendConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to temporarily suspend this connection? Data sharing will be paused.')) {
      return;
    }
    try {
      const res = await suspendBusinessConnectionApi(connectionId, 'Operational pause');
      if (res.success) {
        onTriggerToast('Business connection suspended.', 'warning');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to suspend connection', 'error');
    }
  };

  // Handle Send Connection Request
  const handleSendConnectionRequest = async (e) => {
    e.preventDefault();
    if (!targetOrgId) {
      onTriggerToast('Please select an organization to connect with.', 'warning');
      return;
    }

    setIsSubmittingConnection(true);
    try {
      const payload = {
        receivingOrganizationId: targetOrgId,
        permissions: selectedPermissions,
        purpose: connectionPurpose,
      };

      const res = await createBusinessConnectionApi(payload);
      if (res.success) {
        onTriggerToast('Business connection request sent successfully!', 'success');
        setShowConnectModal(false);
        setTargetOrgId('');
        loadNetworkData();
        setActiveTab('pending');
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to send connection request', 'error');
    } finally {
      setIsSubmittingConnection(false);
    }
  };

  // Handle View Shared Data
  const handleViewSharedData = async (connection) => {
    setSelectedConnection(connection);
    setShowSharedDataModal(true);
    setLoadingSharedData(true);
    try {
      const res = await getConnectionSharedDataApi(connection._id);
      if (res.success) {
        setSharedData(res.data);
      }
    } catch (err) {
      onTriggerToast(err.message || 'Unable to access shared business data', 'error');
      setSharedData(null);
    } finally {
      setLoadingSharedData(false);
    }
  };

  // Handle Open Shared Business Workspace Modal
  const handleOpenWorkspace = async (transaction) => {
    setShowWorkspaceModal(true);
    setLoadingWorkspace(true);
    setActionMessage('');
    try {
      // Calling getBusinessTransactionByIdApi triggers auto transition to 'Viewed' if caller is recipient
      const res = await getBusinessTransactionByIdApi(transaction._id);
      if (res.success) {
        setSelectedTransaction(res.data);
        loadNetworkData(); // Refresh list background status
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to load transaction workspace details', 'error');
      setSelectedTransaction(transaction);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  // Handle Create Business Transaction Submit (Task 21 Flow)
  const handleSendTransactionRequest = async (e) => {
    e.preventDefault();

    if (!targetPartnerConnId) {
      onTriggerToast('Please select a connected business partner.', 'warning');
      return;
    }
    if (!requestTitle.trim()) {
      onTriggerToast('Please enter a request title.', 'warning');
      return;
    }
    if (!expectedDeliveryDate) {
      onTriggerToast('Please specify an expected delivery date.', 'warning');
      return;
    }

    // Date validation
    const reqD = new Date(requestedDate);
    const delD = new Date(expectedDeliveryDate);
    if (delD < reqD) {
      onTriggerToast('Expected delivery date cannot be earlier than requested date.', 'error');
      return;
    }

    const conn = connectedPartners.find((c) => c._id === targetPartnerConnId);
    if (!conn) {
      onTriggerToast('Selected connection invalid or no longer active.', 'error');
      return;
    }

    const recipientOrgId =
      (conn.requestingOrganization?._id?.toString() || conn.requestingOrganization?.id?.toString()) === myOrgIdStr
        ? conn.receivingOrganization?._id || conn.receivingOrganization?.id
        : conn.requestingOrganization?._id || conn.requestingOrganization?.id;

    setIsSubmittingRequest(true);
    try {
      const payload = {
        recipientOrganizationId: recipientOrgId,
        connectionId: conn._id,
        projectId: selectedProjectId || null,
        requestType,
        title: requestTitle,
        materialName: requestType === 'Material Request' ? materialName : '',
        quantity: Number(quantity) || 1,
        unit,
        requestedDate,
        expectedDeliveryDate,
        description,
      };

      const res = await createBusinessTransactionApi(payload);
      if (res.success) {
        onTriggerToast('Request sent successfully.', 'success');
        setShowCreateRequestModal(false);
        resetCreateRequestForm();
        loadNetworkData();
        setActiveTab('transactions');
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to send business request', 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Workspace Action Handlers
  const handleAcceptTransactionAction = async (transactionId) => {
    setIsPerformingAction(true);
    try {
      const res = await acceptBusinessTransactionApi(transactionId, actionMessage);
      if (res.success) {
        onTriggerToast('Transaction accepted! Workspace updated.', 'success');
        setSelectedTransaction(res.data);
        setActionMessage('');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to accept transaction', 'error');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleRejectTransactionAction = async (transactionId) => {
    if (!actionMessage.trim()) {
      onTriggerToast('Please enter a rejection reason note.', 'warning');
      return;
    }
    setIsPerformingAction(true);
    try {
      const res = await rejectBusinessTransactionApi(transactionId, actionMessage);
      if (res.success) {
        onTriggerToast('Transaction rejected.', 'info');
        setSelectedTransaction(res.data);
        setActionMessage('');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to reject transaction', 'error');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleStartTransactionAction = async (transactionId) => {
    setIsPerformingAction(true);
    try {
      const res = await startBusinessTransactionApi(transactionId, { note: actionMessage || 'Delivery started' });
      if (res.success) {
        onTriggerToast('Transaction marked In Progress / Delivery Started.', 'success');
        setSelectedTransaction(res.data);
        setActionMessage('');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to start transaction delivery', 'error');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleCompleteTransactionAction = async (transactionId) => {
    setIsPerformingAction(true);
    try {
      const res = await completeBusinessTransactionApi(transactionId, actionMessage || 'Completed');
      if (res.success) {
        onTriggerToast('Your business transaction has been marked completed.', 'success');
        setSelectedTransaction(res.data);
        setActionMessage('');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to complete transaction', 'error');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleCancelTransactionAction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    setIsPerformingAction(true);
    try {
      const res = await cancelBusinessTransactionApi(transactionId, actionMessage || 'Cancelled by requester');
      if (res.success) {
        onTriggerToast('Transaction request cancelled.', 'warning');
        setSelectedTransaction(res.data);
        setActionMessage('');
        loadNetworkData();
      }
    } catch (err) {
      onTriggerToast(err.message || 'Failed to cancel transaction', 'error');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const resetCreateRequestForm = () => {
    setRequestStep(1);
    setTargetPartnerConnId('');
    setRequestType('Material Request');
    setRequestTitle('');
    setMaterialName('');
    setQuantity(500);
    setUnit('Bags');
    setSelectedProjectId('');
    setRequestedDate(new Date().toISOString().split('T')[0]);
    setExpectedDeliveryDate('');
    setDescription('');
  };

  const togglePermission = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const formatPermissionLabel = (perm) => {
    switch (perm) {
      case 'MATERIAL_ORDERS':
        return 'Materials & Orders';
      case 'DELIVERY_STATUS':
        return 'Live Delivery Status';
      case 'DOCUMENTS':
        return 'Shared Documents';
      case 'PROJECT_MILESTONES':
        return 'Project Milestones';
      case 'SHARED_TASKS':
        return 'Joint Tasks';
      default:
        return perm;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Draft':
        return 'badge-secondary';
      case 'Sent':
        return 'badge-warning';
      case 'Viewed':
        return 'badge-info';
      case 'Accepted':
        return 'badge-success';
      case 'In Progress':
        return 'badge-in-progress';
      case 'Completed':
        return 'badge-completed';
      case 'Rejected':
        return 'badge-delayed';
      case 'Cancelled':
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="page-container business-network-page">
      <style>{`
        .b2b-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 600;
          background: #EFF6FF;
          color: #1677D2;
          border: 1px solid #BFDBFE;
        }

        .b2b-tab-pill {
          padding: 8px 16px;
          font-size: 0.88rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
          background: #F8FAFC;
          color: #64748B;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .b2b-tab-pill:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .b2b-tab-pill.active {
          background: #FFFFFF;
          color: #1677D2;
          border-color: #CBD5E1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .b2b-pill-count {
          padding: 2px 7px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          background: #E2E8F0;
          color: #475569;
        }

        .b2b-tab-pill.active .b2b-pill-count {
          background: #DBEAFE;
          color: #1677D2;
        }

        .b2b-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: all 0.18s ease;
        }

        .b2b-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .b2b-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .b2b-modal {
          background: #FFFFFF;
          border-radius: 14px;
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #E2E8F0;
        }

        .b2b-perm-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.74rem;
          font-weight: 600;
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #E2E8F0;
        }

        .b2b-perm-chip.highlight {
          background: #ECFDF5;
          color: #059669;
          border-color: #A7F3D0;
        }

        .b2b-security-callout {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.82rem;
          color: #166534;
          line-height: 1.45;
        }

        .badge-in-progress {
          background: #F3E8FF;
          color: #7E22CE;
          border: 1px solid #D8B4FE;
        }

        .badge-completed {
          background: #CCFBF1;
          color: #0F766E;
          border: 1px solid #99F6E4;
        }

        .b2b-timeline-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          position: relative;
          padding-bottom: 20px;
        }

        .b2b-timeline-step:last-child {
          padding-bottom: 0;
        }

        .b2b-timeline-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 13px;
          top: 26px;
          bottom: 0;
          width: 2px;
          background: #E2E8F0;
        }

        .b2b-timeline-step.completed:not(:last-child)::after {
          background: #1677D2;
        }

        .b2b-timeline-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #F1F5F9;
          border: 2px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748B;
          z-index: 1;
        }

        .b2b-timeline-step.completed .b2b-timeline-dot {
          background: #1677D2;
          border-color: #1677D2;
          color: #FFFFFF;
        }

        .b2b-timeline-step.active .b2b-timeline-dot {
          background: #3B82F6;
          border-color: #3B82F6;
          color: #FFFFFF;
        }
      `}</style>

      {/* Top Banner & Header */}
      <div className="page-header-row" style={{ marginBottom: '24px' }}>
        <div className="page-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Business Network & Transactions
            </h1>
            <span className="b2b-header-badge">
              <IconShieldCheck size={14} /> Organization Isolation Active
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: 0 }}>
            Connect with construction partners (e.g. Village Builders ↔ City Builders) and exchange business requests in a Shared Workspace.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            id="newBusinessRequestBtn"
            className="btn btn-primary"
            onClick={() => {
              if (connectedPartners.length === 0) {
                onTriggerToast('You must have at least one connected business partner before creating a request.', 'warning');
                setActiveTab('directory');
                return;
              }
              resetCreateRequestForm();
              setShowCreateRequestModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconMaterials size={16} />
            <span>+ New Business Request</span>
          </button>

          <button
            type="button"
            id="connectBusinessBtn"
            className="btn btn-secondary"
            onClick={() => setShowConnectModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconHandshake size={16} />
            <span>+ Connect Partner</span>
          </button>
        </div>
      </div>

      {/* My Organization Summary Strip */}
      {myOrg && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid #E2E8F0',
            padding: '16px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#DBEAFE',
                color: '#1677D2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              <IconBuilding size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {myOrg.name}
                </h3>
                {myOrg.code && (
                  <span style={{ fontSize: '0.72rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#475569' }}>
                    {myOrg.code}
                  </span>
                )}
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Verified Enterprise</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
                <span>Location: <strong>{myOrg.location}</strong></span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>Type: <strong>{myOrg.type}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1677D2' }}>
                {connectedPartners.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Active Partners</div>
            </div>
            <div style={{ height: '30px', width: '1px', background: '#E2E8F0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>
                {incomingTxRequests.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Incoming Requests</div>
            </div>
            <div style={{ height: '30px', width: '1px', background: '#E2E8F0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                {transactions.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Total Transactions</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`b2b-tab-pill ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span>Business Requests & Workspace</span>
          <span className="b2b-pill-count">{transactions.length}</span>
        </button>

        <button
          type="button"
          className={`b2b-tab-pill ${activeTab === 'connected' ? 'active' : ''}`}
          onClick={() => setActiveTab('connected')}
        >
          <span>Connected Partners</span>
          <span className="b2b-pill-count">{connectedPartners.length}</span>
        </button>

        <button
          type="button"
          className={`b2b-tab-pill ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span>Pending Connections</span>
          {pendingRequests.length > 0 && (
            <span className="b2b-pill-count" style={{ background: '#FEF3C7', color: '#B45309' }}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`b2b-tab-pill ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <span>Builder Directory</span>
          <span className="b2b-pill-count">{organizations.length}</span>
        </button>

        <button
          type="button"
          className={`b2b-tab-pill ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <span>Collaboration Audit Log</span>
          <span className="b2b-pill-count">{auditLogs.length}</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
          Loading BuildOps B2B Workspace & Network...
        </div>
      )}

      {/* TAB 1: Business Requests & Shared Workspace (TASK 21 CORE) */}
      {!isLoading && activeTab === 'transactions' && (
        <div>
          {/* Sub-filters for transactions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'All Transactions' },
                { key: 'incoming', label: 'Incoming Requests', count: incomingTxRequests.length },
                { key: 'my_sent', label: 'My Requests' },
                { key: 'active', label: 'Active / In Progress' },
                { key: 'completed', label: 'Completed' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTransactionFilter(f.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: transactionFilter === f.key ? '#1677D2' : '#E2E8F0',
                    background: transactionFilter === f.key ? '#EFF6FF' : '#FFFFFF',
                    color: transactionFilter === f.key ? '#1677D2' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{f.label}</span>
                  {typeof f.count === 'number' && f.count > 0 && (
                    <span style={{ background: '#F59E0B', color: '#FFFFFF', padding: '1px 6px', borderRadius: '9999px', fontSize: '0.7rem' }}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (connectedPartners.length === 0) {
                  onTriggerToast('Please connect with a business partner first.', 'warning');
                  return;
                }
                resetCreateRequestForm();
                setShowCreateRequestModal(true);
              }}
            >
              + Create Request
            </button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="b2b-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EFF6FF', color: '#1677D2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <IconMaterials size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                No Business Requests Found
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 18px auto' }}>
                Initiate a controlled Material Request or Service Request to collaborate with your connected business partners.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  resetCreateRequestForm();
                  setShowCreateRequestModal(true);
                }}
              >
                + Create Business Request
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {filteredTransactions.map((tx) => {
                const isRequester = (tx.requesterOrganization?._id?.toString() || tx.requesterOrganization?.id?.toString()) === myOrgIdStr;
                const partnerOrg = isRequester ? tx.recipientOrganization : tx.requesterOrganization;

                return (
                  <div key={tx._id} className="b2b-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span className="b2b-perm-chip highlight" style={{ fontSize: '0.72rem' }}>
                            {tx.requestType}
                          </span>
                          {!isRequester && ['Sent', 'Viewed'].includes(tx.status) && (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Incoming</span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                          {tx.title}
                        </h3>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '12px' }}>
                      <strong>{tx.requesterOrganization?.name}</strong> ↔ <strong>{tx.recipientOrganization?.name}</strong>
                    </div>

                    <div
                      style={{
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        fontSize: '0.82rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748B' }}>Material / Service:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{tx.materialName || tx.title}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Quantity:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{tx.quantity} {tx.unit}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Required Date:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {new Date(tx.requestedDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Expected Delivery:</span>
                        <div style={{ fontWeight: 600, color: '#1677D2' }}>
                          {new Date(tx.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Linked Project Reference (Sanitized Exposure) */}
                    {tx.projectId && (
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📍 Linked Project:</span>
                        <strong style={{ color: '#0F172A' }}>{tx.projectId.name} ({tx.projectId.location})</strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                        Created: {new Date(tx.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenWorkspace(tx)}
                      >
                        View Request & Workspace &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Connected Partners */}
      {!isLoading && activeTab === 'connected' && (
        <div>
          {connectedPartners.length === 0 ? (
            <div className="b2b-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EFF6FF', color: '#1677D2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <IconNetwork size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                No Connected Partners Yet
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 18px auto' }}>
                BuildOps AI lets you securely establish business links with suppliers and regional builders to exchange materials and delivery tracking.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowConnectModal(true)}
              >
                + Connect Your First Partner
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {connectedPartners.map((conn) => {
                const partnerOrg =
                  (conn.requestingOrganization?._id?.toString() || conn.requestingOrganization?.id?.toString()) === myOrgIdStr
                    ? conn.receivingOrganization
                    : conn.requestingOrganization;

                return (
                  <div key={conn._id} className="b2b-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            {partnerOrg.name}
                          </h3>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '3px' }}>
                          📍 {partnerOrg.location} • <span style={{ fontWeight: 600 }}>{partnerOrg.type}</span>
                        </div>
                      </div>
                      <span className="badge badge-success">Connected</span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '14px', lineHeight: '1.4' }}>
                      {conn.purpose || 'Active inter-organization collaboration.'}
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                        Shared Data Permissions
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(conn.permissions || []).map((p) => (
                          <span key={p} className="b2b-perm-chip highlight">
                            ✓ {formatPermissionLabel(p)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewSharedData(conn)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>View Shared Data</span>
                        <span style={{ fontSize: '0.8rem' }}>&rarr;</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSuspendConnection(conn._id)}
                        style={{ color: '#64748B' }}
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Pending Connections */}
      {!isLoading && activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Incoming Connection Requests */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Incoming Connection Requests</span>
              <span className="badge badge-info">{incomingPending.length}</span>
            </h3>

            {incomingPending.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
                No pending requests requiring your approval.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incomingPending.map((req) => (
                  <div key={req._id} className="b2b-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            {req.requestingOrganization?.name}
                          </h4>
                          <span className="badge badge-warning">Action Required</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                          Location: <strong>{req.requestingOrganization?.location}</strong> • Requested by:{' '}
                          <strong>{req.requestedBy?.name || 'Partner Admin'}</strong>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#334155', marginTop: '8px', marginBottom: '10px' }}>
                          "{req.purpose}"
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(req.permissions || []).map((p) => (
                            <span key={p} className="b2b-perm-chip">
                              {formatPermissionLabel(p)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignSelf: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ background: '#059669', borderColor: '#059669' }}
                          onClick={() => handleAcceptConnection(req._id)}
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#EF4444' }}
                          onClick={() => handleRejectConnection(req._id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Outgoing Requests Sent</span>
              <span className="badge badge-info">{outgoingPending.length}</span>
            </h3>

            {outgoingPending.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
                No outgoing connection requests awaiting partner approval.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {outgoingPending.map((req) => (
                  <div key={req._id} className="b2b-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {req.receivingOrganization?.name}
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                          Location: {req.receivingOrganization?.location} • Status: Awaiting partner confirmation
                        </div>
                      </div>
                      <span className="badge badge-warning">Pending Approval</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Builder Directory */}
      {!isLoading && activeTab === 'directory' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search organizations by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <IconSearch size={16} />
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {organizations
              .filter(
                (o) =>
                  !searchQuery ||
                  o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  o.location.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((org) => {
                const isConnected = connectedPartners.some(
                  (c) =>
                    (c.requestingOrganization?._id?.toString() || c.requestingOrganization?.id?.toString()) === org._id ||
                    (c.receivingOrganization?._id?.toString() || c.receivingOrganization?.id?.toString()) === org._id
                );

                const isPending = pendingRequests.some(
                  (c) =>
                    (c.requestingOrganization?._id?.toString() || c.requestingOrganization?.id?.toString()) === org._id ||
                    (c.receivingOrganization?._id?.toString() || c.receivingOrganization?.id?.toString()) === org._id
                );

                return (
                  <div key={org._id} className="b2b-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {org.name}
                      </h4>
                      {isConnected ? (
                        <span className="badge badge-success">Connected</span>
                      ) : isPending ? (
                        <span className="badge badge-warning">Request Pending</span>
                      ) : (
                        <span className="badge badge-info">{org.type}</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '10px' }}>
                      📍 {org.location}
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#475569', minHeight: '38px', marginBottom: '14px', lineHeight: '1.4' }}>
                      {org.description || 'Regional construction and infrastructure enterprise.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                      {isConnected ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const conn = connectedPartners.find(
                              (c) =>
                                (c.requestingOrganization?._id?.toString() || c.requestingOrganization?.id?.toString()) === org._id ||
                                (c.receivingOrganization?._id?.toString() || c.receivingOrganization?.id?.toString()) === org._id
                            );
                            if (conn) handleViewSharedData(conn);
                          }}
                        >
                          View Shared Data
                        </button>
                      ) : isPending ? (
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>Pending Request</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setTargetOrgId(org._id);
                            setShowConnectModal(true);
                          }}
                        >
                          + Request Connection
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 5: Collaboration Audit Log */}
      {!isLoading && activeTab === 'audit' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Immutable B2B Collaboration Audit Trail
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Tracks connection events, permission changes, and cross-organization business transactions.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Organization</th>
                  <th>Target Organization</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            log.action.includes('ACCEPTED') || log.action.includes('GRANTED') || log.action.includes('COMPLETED')
                              ? 'badge-success'
                              : log.action.includes('REQUESTED') || log.action.includes('CREATED') || log.action.includes('VIEWED')
                              ? 'badge-info'
                              : log.action.includes('REJECTED') || log.action.includes('SUSPENDED') || log.action.includes('CANCELLED')
                              ? 'badge-delayed'
                              : 'badge-info'
                          }`}
                          style={{ fontSize: '0.74rem' }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                        {log.actor?.name || 'System'}
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{log.organization?.name || '—'}</td>
                      <td style={{ fontSize: '0.84rem' }}>{log.targetOrganization?.name || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Connect Business (Task 20) */}
      {showConnectModal && (
        <div className="b2b-modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="b2b-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconHandshake size={20} color="#1677D2" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Establish Business Connection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendConnectionRequest} style={{ padding: '24px' }}>
              <div className="b2b-security-callout" style={{ marginBottom: '20px' }}>
                <IconShieldCheck size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Controlled B2B Sharing Model:</strong> The partner organization will only access data categories you explicitly permit below. Private projects, internal tasks, and financial data will remain strictly confidential.
                </div>
              </div>

              {/* Target Organization Selector */}
              <div style={{ marginBottom: '18px' }}>
                <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Target Business / Organization *
                </label>
                <select
                  id="targetOrganizationSelect"
                  className="input-field"
                  value={targetOrgId}
                  onChange={(e) => setTargetOrgId(e.target.value)}
                  required
                >
                  <option value="">Select a builder from the directory...</option>
                  {organizations
                    .filter((o) => o._id !== myOrgIdStr)
                    .map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name} — {org.location} ({org.type})
                      </option>
                    ))}
                </select>
              </div>

              {/* Permission Checkboxes */}
              <div style={{ marginBottom: '18px' }}>
                <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Data Sharing Permissions to Grant
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'MATERIAL_ORDERS', label: 'Material Orders & Requirements', desc: 'Permits tracking inter-company supply batches' },
                    { id: 'DELIVERY_STATUS', label: 'Live Delivery Status & Dispatch Tracking', desc: 'Permits vehicle numbers and transit tracking' },
                    { id: 'DOCUMENTS', label: 'Shared Compliance & Quality Documents', desc: 'Permits joint blueprints and lab certifications' },
                    { id: 'PROJECT_MILESTONES', label: 'High-Level Project Milestones', desc: 'Exposes milestone progress without internal tasks' },
                  ].map((perm) => (
                    <label
                      key={perm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        background: selectedPermissions.includes(perm.id) ? '#F8FAFC' : '#FFFFFF',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
                          {perm.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{perm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Purpose / Message */}
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Collaboration Purpose / Note
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={connectionPurpose}
                  onChange={(e) => setConnectionPurpose(e.target.value)}
                  placeholder="e.g. Village-to-city builder material supply and joint structural surveying."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConnectModal(false)}
                  disabled={isSubmittingConnection}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submitConnectionRequestBtn"
                  className="btn btn-primary"
                  disabled={isSubmittingConnection}
                >
                  {isSubmittingConnection ? 'Sending Request...' : 'Send Connection Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Business Request Wizard (TASK 21) */}
      {showCreateRequestModal && (
        <div className="b2b-modal-overlay" onClick={() => setShowCreateRequestModal(false)}>
          <div className="b2b-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconMaterials size={20} color="#1677D2" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Create New Business Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRequestModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTransactionRequest} style={{ padding: '24px' }}>
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {[
                  { num: 1, label: 'Partner' },
                  { num: 2, label: 'Type' },
                  { num: 3, label: 'Details' },
                  { num: 4, label: 'Review' },
                ].map((s) => (
                  <div
                    key={s.num}
                    onClick={() => s.num < requestStep && setRequestStep(s.num)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: requestStep === s.num ? '#EFF6FF' : requestStep > s.num ? '#F1F5F9' : '#F8FAFC',
                      color: requestStep === s.num ? '#1677D2' : requestStep > s.num ? '#059669' : '#94A3B8',
                      border: '1px solid',
                      borderColor: requestStep === s.num ? '#BFDBFE' : '#E2E8F0',
                      cursor: s.num < requestStep ? 'pointer' : 'default',
                    }}
                  >
                    {s.num}. {s.label}
                  </div>
                ))}
              </div>

              {/* STEP 1: Select Business Partner */}
              {requestStep === 1 && (
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                    Step 1: Select Connected Business Partner
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '16px' }}>
                    Choose an active business partner with whom your organization has an accepted connection.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {connectedPartners.map((conn) => {
                      const partnerOrg =
                        (conn.requestingOrganization?._id?.toString() || conn.requestingOrganization?.id?.toString()) === myOrgIdStr
                          ? conn.receivingOrganization
                          : conn.requestingOrganization;

                      const isSelected = targetPartnerConnId === conn._id;

                      return (
                        <div
                          key={conn._id}
                          onClick={() => setTargetPartnerConnId(conn._id)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isSelected ? '#1677D2' : '#E2E8F0',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A' }}>
                              {partnerOrg?.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                              📍 {partnerOrg?.location} • {partnerOrg?.type}
                            </div>
                          </div>
                          <input type="radio" checked={isSelected} onChange={() => {}} />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (!targetPartnerConnId) {
                          onTriggerToast('Please select a partner to continue.', 'warning');
                          return;
                        }
                        setRequestStep(2);
                      }}
                    >
                      Next: Request Type &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Select Request Type */}
              {requestStep === 2 && (
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                    Step 2: Select Business Request Type
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { id: 'Material Request', title: 'Material Request', desc: 'Request raw materials, batch cement, structural steel, or aggregates.' },
                      { id: 'Service Request', title: 'Service Request', desc: 'Request subcontracting, equipment rental, structural consulting, or labor.' },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setRequestType(t.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: '2px solid',
                          borderColor: requestType === t.id ? '#1677D2' : '#E2E8F0',
                          background: requestType === t.id ? '#EFF6FF' : '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.4' }}>
                          {t.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setRequestStep(1)}>
                      &larr; Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setRequestStep(3)}>
                      Next: Request Details &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Enter Details */}
              {requestStep === 3 && (
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
                    Step 3: Enter Request Details
                  </h4>

                  <div style={{ marginBottom: '14px' }}>
                    <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Request Title *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 500 Bags Cement Supply for RCC Slab Work"
                      value={requestTitle}
                      onChange={(e) => setRequestTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ gridColumn: 'span 1' }}>
                      <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Item / Material Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Cement 53 Grade"
                        value={materialName}
                        onChange={(e) => setMaterialName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Quantity *
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Unit *
                      </label>
                      <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                        <option value="Bags">Bags</option>
                        <option value="Tons">Tons</option>
                        <option value="Units">Units</option>
                        <option value="Cubic Meters">Cubic Meters</option>
                        <option value="Truck Loads">Truck Loads</option>
                        <option value="Hours">Hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Project Selector (Requester's own projects only) */}
                  <div style={{ marginBottom: '14px' }}>
                    <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Link to Requester Project (Optional)
                    </label>
                    <select
                      className="input-field"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">Select one of your projects (Only public info shared)...</option>
                      {projects.map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name} ({p.location})
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                      🔒 Note: Internal tasks, financial figures, and AI chats remain private. Only project name & location are exposed.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Requested Date *
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={requestedDate}
                        onChange={(e) => setRequestedDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Expected Delivery Date *
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Description & Work Specifications
                    </label>
                    <textarea
                      className="input-field"
                      rows="3"
                      placeholder="e.g. Required for RCC column and beam casting at Sanand site."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setRequestStep(2)}>
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (!requestTitle.trim() || !expectedDeliveryDate) {
                          onTriggerToast('Please fill in title and expected delivery date.', 'warning');
                          return;
                        }
                        if (new Date(expectedDeliveryDate) < new Date(requestedDate)) {
                          onTriggerToast('Expected delivery date cannot be earlier than requested date.', 'error');
                          return;
                        }
                        setRequestStep(4);
                      }}
                    >
                      Next: Review Request &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Send */}
              {requestStep === 4 && (
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
                    Step 4: Review Business Request
                  </h4>

                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '20px',
                      fontSize: '0.86rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span className="b2b-perm-chip highlight">{requestType}</span>
                      <span className="badge badge-warning">Ready to Send</span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
                      {requestTitle}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#334155', marginBottom: '12px' }}>
                      <div>Material/Service: <strong>{materialName || requestTitle}</strong></div>
                      <div>Quantity: <strong>{quantity} {unit}</strong></div>
                      <div>Requested Date: <strong>{new Date(requestedDate).toLocaleDateString()}</strong></div>
                      <div>Expected Delivery: <strong>{new Date(expectedDeliveryDate).toLocaleDateString()}</strong></div>
                    </div>

                    {description && (
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 10px 0' }}>
                        "{description}"
                      </p>
                    )}

                    {selectedProjectId && (
                      <div style={{ fontSize: '0.78rem', color: '#1677D2', fontWeight: 600 }}>
                        📍 Linked Project: {projects.find((p) => (p._id || p.id) === selectedProjectId)?.name || 'Project'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setRequestStep(3)}
                      disabled={isSubmittingRequest}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="submit"
                      id="sendBusinessRequestBtn"
                      className="btn btn-primary"
                      disabled={isSubmittingRequest}
                    >
                      {isSubmittingRequest ? 'Sending Request...' : 'Send Request'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Controlled Shared Data (Task 20) */}
      {showSharedDataModal && (
        <div className="b2b-modal-overlay" onClick={() => setShowSharedDataModal(false)}>
          <div className="b2b-modal" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconShieldCheck size={20} color="#059669" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Controlled Shared Business Data
                  </h3>
                </div>
                {sharedData && (
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Connection between <strong>{sharedData.myOrganization.name}</strong> ↔ <strong>{sharedData.partnerOrganization.name}</strong>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSharedDataModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {loadingSharedData ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px auto' }} />
                  Verifying permissions & loading authorized shared data...
                </div>
              ) : sharedData ? (
                <div>
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '20px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748B' }}>Connection Status:</span>{' '}
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Active & Accepted</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Active Permissions:</span>{' '}
                      <strong>{sharedData.activePermissions.length} categories</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Data Isolation:</span>{' '}
                      <strong style={{ color: '#059669' }}>Strictly Enforced</strong>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
                    Permitted Operational Resources ({sharedData.sharedItems.length})
                  </h4>

                  {sharedData.sharedItems.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                      No items currently shared under active permissions.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sharedData.sharedItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="b2b-perm-chip highlight" style={{ fontSize: '0.72rem' }}>
                                {item.permittedBy}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600 }}>
                                #{item.id}
                              </span>
                            </div>
                            <span className="badge badge-info">{item.status || item.verificationStatus || 'Active'}</span>
                          </div>

                          <h5 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
                            {item.title}
                          </h5>

                          {item.description && (
                            <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                              {item.description}
                            </p>
                          )}

                          <div
                            style={{
                              paddingTop: '8px',
                              borderTop: '1px dashed #E2E8F0',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '14px',
                              fontSize: '0.76rem',
                              color: '#64748B',
                            }}
                          >
                            <span>Owned by: <strong style={{ color: '#0F172A' }}>{item.ownerOrganization}</strong></span>
                            <span>Shared by: <strong style={{ color: '#0F172A' }}>{item.sharedBy}</strong></span>
                            <span>Permission: <strong style={{ color: '#1677D2' }}>{item.permittedBy}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#EF4444', textAlign: 'center', padding: '20px' }}>
                  Unable to display shared resources.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSharedDataModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Shared Business Workspace (TASK 21 WORKSPACE & LIFECYCLE CONTROLS) */}
      {showWorkspaceModal && selectedTransaction && (
        <div className="b2b-modal-overlay" onClick={() => setShowWorkspaceModal(false)}>
          <div className="b2b-modal" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="b2b-perm-chip highlight">{selectedTransaction.requestType}</span>
                  <span className={`badge ${getStatusBadgeClass(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
                  {selectedTransaction.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkspaceModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {loadingWorkspace ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px auto' }} />
                  Loading Shared Business Workspace...
                </div>
              ) : (
                <div>
                  {/* Organization Relationship Header */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                      border: '1px solid #DBEAFE',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                        Requesting Organization
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
                        {selectedTransaction.requesterOrganization?.name} ({selectedTransaction.requesterOrganization?.location})
                      </div>
                    </div>

                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1677D2' }}>↔</div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                        Recipient Organization
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
                        {selectedTransaction.recipientOrganization?.name} ({selectedTransaction.recipientOrganization?.location})
                      </div>
                    </div>
                  </div>

                  {/* Request Details Grid */}
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                    Request Details
                  </h4>
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '24px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '14px',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Material / Service</span>
                      <strong style={{ color: '#0F172A' }}>{selectedTransaction.materialName || selectedTransaction.title}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Quantity & Unit</span>
                      <strong style={{ color: '#0F172A' }}>{selectedTransaction.quantity} {selectedTransaction.unit}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Requested Date</span>
                      <strong style={{ color: '#0F172A' }}>{new Date(selectedTransaction.requestedDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block' }}>Expected Delivery</span>
                      <strong style={{ color: '#1677D2' }}>{new Date(selectedTransaction.expectedDeliveryDate).toLocaleDateString()}</strong>
                    </div>

                    {selectedTransaction.projectId && (
                      <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #E2E8F0', paddingTop: '10px' }}>
                        <span style={{ color: '#64748B' }}>Linked Project Reference:</span>{' '}
                        <strong style={{ color: '#0F172A' }}>
                          {selectedTransaction.projectId.name} — {selectedTransaction.projectId.location} (Client: {selectedTransaction.projectId.client})
                        </strong>
                      </div>
                    )}

                    {selectedTransaction.description && (
                      <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', padding: '10px', borderRadius: '6px' }}>
                        <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Description Note:</span>
                        <div style={{ color: '#334155' }}>{selectedTransaction.description}</div>
                      </div>
                    )}
                  </div>

                  {/* Business Activity Timeline */}
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
                    Business Activity Timeline
                  </h4>
                  <div style={{ marginBottom: '24px', paddingLeft: '8px' }}>
                    {[
                      { key: 'Sent', title: 'Request Sent', desc: 'Request created by requester' },
                      { key: 'Viewed', title: 'Request Viewed', desc: 'Opened by recipient organization' },
                      { key: 'Accepted', title: 'Request Accepted', desc: 'Accepted by recipient organization' },
                      { key: 'In Progress', title: 'Delivery Started / In Progress', desc: 'Execution initiated' },
                      { key: 'Completed', title: 'Completed', desc: 'Transaction successfully fulfilled' },
                    ].map((step, idx) => {
                      const timelineEntry = (selectedTransaction.activityTimeline || []).find((t) => t.status === step.key);
                      const isCompleted = !!timelineEntry;
                      const isCurrent = selectedTransaction.status === step.key;

                      return (
                        <div
                          key={step.key}
                          className={`b2b-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                        >
                          <div className="b2b-timeline-dot">
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isCompleted ? '#0F172A' : '#64748B' }}>
                              {step.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              {timelineEntry ? (
                                <span>
                                  {new Date(timelineEntry.timestamp).toLocaleString()} {timelineEntry.note ? `— "${timelineEntry.note}"` : ''}
                                </span>
                              ) : (
                                step.desc
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Context-Aware Action Controls */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: '0 0 10px 0' }}>
                      Transaction Actions
                    </h4>

                    {/* Note input for actions */}
                    {['Sent', 'Viewed', 'Accepted', 'In Progress'].includes(selectedTransaction.status) && (
                      <div style={{ marginBottom: '12px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Optional response note / reason / tracking note..."
                          value={actionMessage}
                          onChange={(e) => setActionMessage(e.target.value)}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Recipient Actions on Sent/Viewed */}
                      {(selectedTransaction.recipientOrganization?._id?.toString() || selectedTransaction.recipientOrganization?.id?.toString()) === myOrgIdStr &&
                        ['Sent', 'Viewed'].includes(selectedTransaction.status) && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ background: '#059669', borderColor: '#059669' }}
                              onClick={() => handleAcceptTransactionAction(selectedTransaction._id)}
                              disabled={isPerformingAction}
                            >
                              ✓ Accept Request
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#EF4444' }}
                              onClick={() => handleRejectTransactionAction(selectedTransaction._id)}
                              disabled={isPerformingAction}
                            >
                              ✕ Reject Request
                            </button>
                          </>
                        )}

                      {/* Start Delivery Action on Accepted */}
                      {selectedTransaction.status === 'Accepted' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStartTransactionAction(selectedTransaction._id)}
                          disabled={isPerformingAction}
                        >
                          🚚 Start Delivery / Execution
                        </button>
                      )}

                      {/* Complete Action on Accepted / In Progress */}
                      {['Accepted', 'In Progress'].includes(selectedTransaction.status) && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ background: '#0F766E', borderColor: '#0F766E' }}
                          onClick={() => handleCompleteTransactionAction(selectedTransaction._id)}
                          disabled={isPerformingAction}
                        >
                          ✓ Mark Completed
                        </button>
                      )}

                      {/* Requester Cancel Action */}
                      {(selectedTransaction.requesterOrganization?._id?.toString() || selectedTransaction.requesterOrganization?.id?.toString()) === myOrgIdStr &&
                        ['Sent', 'Viewed', 'Accepted'].includes(selectedTransaction.status) && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#64748B' }}
                            onClick={() => handleCancelTransactionAction(selectedTransaction._id)}
                            disabled={isPerformingAction}
                          >
                            Cancel Request
                          </button>
                        )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowWorkspaceModal(false)}
                    >
                      Close Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
