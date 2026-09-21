import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  analyzeProjectApi,
  chatWithProjectApi,
  getProjectsApi,
  getConversationsApi,
  getConversationByIdApi,
  createConversationApi,
  sendConversationMessageApi,
  deleteConversationApi,
  getProjectRiskApi,
} from '../services/api';
import { exportAiProjectReportPdf } from '../utils/fileDownloader';
import {
  IconSparkles,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconMaterials,
  IconPaperclip,
  IconSend,
  IconMessageSquare,
  IconPlus,
  IconMenu,
  IconX,
  IconImage,
  IconTrash,
  IconSearch,
  IconDocuments,
  IconFilePdf,
} from '../components/common/Icons';

// Image constraints (Task 2 & 3)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const MAX_IMAGES_COUNT = 3;

// Document constraints (Task 7)
const ALLOWED_DOC_EXTENSIONS = ['.pdf'];
const MAX_DOC_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB limit
const MAX_DOCS_COUNT = 3;

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Dynamically groups conversations by local user date (Task 6)
 */
const groupConversationsByDate = (conversationsList) => {
  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  for (const c of conversationsList) {
    const t = new Date(c.updatedAt || c.createdAt).getTime();
    if (t >= todayStart) {
      groups.Today.push(c);
    } else if (t >= yesterdayStart) {
      groups.Yesterday.push(c);
    } else if (t >= sevenDaysAgoStart) {
      groups['Previous 7 Days'].push(c);
    } else {
      groups.Older.push(c);
    }
  }

  return groups;
};

/**
 * Dynamically generates a natural, construction-grounded question based on the dashboard insight
 */
export const generateInsightQuestion = (ctx) => {
  if (!ctx) return 'Analyze the project status and provide actionable recommendations.';
  const { projectName, insightType, insightTitle, insightDescription, affectedTaskName, delayDays } = ctx;

  const type = (insightType || insightTitle || 'Schedule Pressure').toLowerCase();

  if (affectedTaskName) {
    const delaySnippet = delayDays > 0 ? `delayed by ${delayDays} days` : 'delayed';
    return `What should we do about the schedule pressure in ${projectName || 'the project'} caused by the ${affectedTaskName} task being ${delaySnippet}? Please provide a structured analysis including Situation, Evidence, Impact, Recommended Actions, Priority, and immediate Next Steps.`;
  }

  if (type.includes('material') || type.includes('stock')) {
    return `Analyze the material risk in ${projectName || 'the project'}${insightDescription ? `: "${insightDescription}"` : ''}. Which materials are at risk, what is the shortfall, and what recovery actions should we take?`;
  }

  if (type.includes('cost') || type.includes('budget') || type.includes('financial')) {
    return `Analyze the cost and financial risk in ${projectName || 'the project'}${insightDescription ? `: "${insightDescription}"` : ''}. What factors are driving this concern and what corrective actions are recommended?`;
  }

  if (insightDescription) {
    return `Analyze the ${insightTitle || 'issue'} detected in ${projectName || 'the project'}: "${insightDescription}". What is the operational impact and what specific actions should the project team take?`;
  }

  return `Analyze the ${insightTitle || 'operational status'} in ${projectName || 'the project'} and recommend recovery actions.`;
};

export const AIInsights = ({
  projects = [],
  selectedProjectId,
  onSelectProject,
  onTriggerAction,
  insightContext,
  onClearInsightContext,
}) => {
  const { t } = useTranslation();

  // Project selection state (Task 5: Real MongoDB projects)
  const [dbProjects, setDbProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('all');

  // Dashboard Insight Context Banner & Ref to avoid duplicate triggers
  const [activeInsightBanner, setActiveInsightBanner] = useState(null);
  const lastTriggeredContextIdRef = useRef(null);

  // Persistent Conversation History State (Task 6)
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null); // null = Welcome state
  const [activeConversationData, setActiveConversationData] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [hoveredConvId, setHoveredConvId] = useState(null);

  // Chat composer state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatLoadingText, setChatLoadingText] = useState('BuildOps AI is analyzing project records...');
  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Task 2 & 3: Image attachment state
  const [selectedImages, setSelectedImages] = useState([]); // [{ id, file, url, name, size, formattedSize }]
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const fileInputRef = useRef(null);

  // Task 7: Document attachment state
  const [selectedDocuments, setSelectedDocuments] = useState([]); // [{ id, file, name, size, formattedSize }]
  const docInputRef = useRef(null);

  // Common UI validation & Drag-and-Drop state
  const [validationError, setValidationError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Preserved: Full Analysis Modal / Report drawer state
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [projectMeta, setProjectMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // 4 Suggested Prompts for Welcome State
  const welcomePrompts = [
    "Give me today's project briefing",
    'Generate a project status report',
    'Which tasks are delayed?',
    'What materials are low?',
  ];

  // 1. Fetch real projects from MongoDB on mount (Task 5)
  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        const res = await getProjectsApi();
        if (res.success && Array.isArray(res.data) && res.data.length > 0 && isMounted) {
          setDbProjects(res.data);
          // Default to Chandkheda if exists, or passed prop, or 'all'
          const chandkheda = res.data.find((p) => p.name?.toLowerCase().includes('chandkheda'));
          const initialId = selectedProjectId || (chandkheda ? chandkheda._id : res.data[0]._id);
          setActiveProjectId(initialId);
        } else if (projects.length > 0 && isMounted) {
          setActiveProjectId(projects[0].id || projects[0]._id || 'all');
        }
      } catch (err) {
        console.warn('Failed to load DB projects list for AI Insights, using fallback:', err);
        if (projects.length > 0 && isMounted) {
          setActiveProjectId(projects[0].id || projects[0]._id || 'all');
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  // 2. Fetch persistent conversations on mount (Task 6)
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const res = await getConversationsApi();
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch (err) {
      console.warn('Failed to load conversation history from MongoDB:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 3. Load active conversation messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setActiveConversationData(null);
      return;
    }

    let isMounted = true;
    const fetchConversationDetails = async () => {
      try {
        const res = await getConversationByIdApi(activeConvId);
        if (res.success && res.data && isMounted) {
          setActiveConversationData(res.data);
          // Restore project context associated with this conversation
          if (res.data.projectId) {
            setActiveProjectId(res.data.projectId);
          } else {
            setActiveProjectId('all');
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch messages for conversation ${activeConvId}:`, err);
      }
    };

    fetchConversationDetails();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  // 4. Auto-Initiate Conversation when Navigated from Dashboard "View Recommendation ->"
  useEffect(() => {
    if (!insightContext || !insightContext.projectId) return;

    const contextKey = `${insightContext.projectId}-${insightContext.affectedTaskId || insightContext.insightTitle}-${insightContext.timestamp || ''}`;
    if (lastTriggeredContextIdRef.current === contextKey) return;
    lastTriggeredContextIdRef.current = contextKey;

    let isMounted = true;

    const startInsightConversation = async () => {
      try {
        setIsChatLoading(true);
        setChatLoadingText('BuildOps AI is analyzing project telemetry for recommendation...');

        // 1. Switch active project selector to the insight's project
        setActiveProjectId(insightContext.projectId);
        if (onSelectProject) onSelectProject(insightContext.projectId);

        // 2. Set active insight banner for chat UI
        setActiveInsightBanner({
          projectId: insightContext.projectId,
          projectName: insightContext.projectName,
          insightTitle: insightContext.insightTitle || insightContext.title || 'Schedule Pressure Detected',
          insightDescription: insightContext.insightDescription || insightContext.description,
          affectedTaskName: insightContext.affectedTaskName,
          delayDays: insightContext.delayDays,
          priority: insightContext.taskPriority || 'Critical',
        });

        // 3. Prepare dynamic question based on real insight context
        const promptText = generateInsightQuestion(insightContext);
        const convTitle = `${insightContext.insightTitle || 'AI Recommendation'}: ${insightContext.projectName}`;

        // 4. Create new persistent conversation in MongoDB
        const createRes = await createConversationApi({
          projectId: insightContext.projectId,
          projectName: insightContext.projectName,
          title: convTitle.slice(0, 70),
        });

        if (!createRes.success || !createRes.data) {
          throw new Error(createRes.error || 'Failed to initialize AI conversation record.');
        }

        const newConvId = createRes.data._id || createRes.data.id;
        if (!isMounted) return;

        setActiveConvId(newConvId);

        // 5. Optimistically update message list with user question
        const localUserMessage = {
          role: 'user',
          content: promptText,
          projectId: insightContext.projectId,
          createdAt: new Date().toISOString(),
        };
        setActiveConversationData({
          _id: newConvId,
          projectId: insightContext.projectId,
          projectName: insightContext.projectName,
          title: convTitle,
          messages: [localUserMessage],
        });

        // 6. Send message to backend Gemini pipeline
        const sendRes = await sendConversationMessageApi(newConvId, {
          message: promptText,
          projectId: insightContext.projectId,
        });

        if (sendRes.success && sendRes.conversation && isMounted) {
          setActiveConversationData(sendRes.conversation);
          loadConversations();
          if (onTriggerAction) {
            onTriggerAction('AI Recommendation loaded successfully.');
          }
        } else {
          throw new Error(sendRes.error || 'Failed to receive AI recommendation.');
        }
      } catch (err) {
        console.error('Error auto-initiating insight conversation:', err);
        if (isMounted) {
          setValidationError(`Unable to load recommendation: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setIsChatLoading(false);
          if (onClearInsightContext) onClearInsightContext();
        }
      }
    };

    startInsightConversation();

    return () => {
      isMounted = false;
    };
  }, [insightContext]);

  // Handle Project Selector Change
  const handleProjectChange = (newId) => {
    setActiveProjectId(newId);
    if (onSelectProject) onSelectProject(newId);
  };

  // Run structured project analysis (preserving existing API)
  const runAnalysis = async () => {
    if (!activeProjectId || activeProjectId === 'all') return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await analyzeProjectApi(activeProjectId);
      if (response.success && response.data) {
        setAnalysisData(response.data);
        setProjectMeta(response.projectMeta);
        setIsAnalysisDrawerOpen(true);
      } else {
        throw new Error(response.error || 'Invalid response received from AI engine.');
      }
    } catch (err) {
      console.error('Error running AI project analysis:', err);
      setErrorMessage(err.message || 'Failed to connect to the Gemini AI Analysis Engine.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Active messages list (from real MongoDB conversation object)
  const currentMessages = useMemo(() => {
    if (!activeConversationData || !Array.isArray(activeConversationData.messages)) {
      return [];
    }
    return activeConversationData.messages;
  }, [activeConversationData]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isChatLoading]);

  // Handle "+ New Chat" (Task 6)
  const handleNewChat = () => {
    setActiveConvId(null);
    setActiveConversationData(null);
    setChatInput('');
    setSelectedImages([]);
    setSelectedDocuments([]);
    setValidationError(null);
    setIsMobileSidebarOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Select a conversation from sidebar (Task 6)
  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    setDeleteConfirmId(null);
    setIsMobileSidebarOpen(false);
  };

  // Delete conversation with inline confirmation (Task 6)
  const handleDeleteConversation = async (convId) => {
    try {
      const res = await deleteConversationApi(convId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => (c._id || c.id) !== convId));
        if (activeConvId === convId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Handle Suggested Prompt Click -> Sends prompt directly
  const handlePromptClick = (promptText) => {
    handleSendMessage(promptText);
  };

  // Auto-dismiss validation error after 5 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  // Validate and process added images (Task 2 & 3)
  const validateAndProcessImageFiles = (filesList) => {
    setValidationError(null);
    const files = Array.from(filesList);
    if (!files || files.length === 0) return;

    if (selectedImages.length + files.length > MAX_IMAGES_COUNT) {
      setValidationError('You can attach up to 3 images per message.');
      return;
    }

    const validNewImages = [];

    for (const file of files) {
      const ext = '.' + (file.name ? file.name.split('.').pop() : '').toLowerCase();
      const mimeType = (file.type || '').toLowerCase();
      const isAllowedMime = ALLOWED_IMAGE_TYPES.includes(mimeType);
      const isAllowedExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext);

      if (!isAllowedMime && !isAllowedExt) {
        setValidationError('Unsupported image format. Please use JPG, PNG, or WebP.');
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setValidationError('Image is too large. Maximum image size is 10 MB.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      validNewImages.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        url: previewUrl,
        name: file.name || 'construction_image.png',
        size: file.size,
        formattedSize: formatFileSize(file.size),
      });
    }

    if (validNewImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...validNewImages]);
      setValidationError(null);
    }
  };

  // Validate and process added PDF documents (Task 7)
  const validateAndProcessDocumentFiles = (filesList) => {
    setValidationError(null);
    const files = Array.from(filesList);
    if (!files || files.length === 0) return;

    if (selectedDocuments.length + files.length > MAX_DOCS_COUNT) {
      setValidationError('You can attach up to 3 documents per message.');
      return;
    }

    const validNewDocs = [];

    for (const file of files) {
      const ext = '.' + (file.name ? file.name.split('.').pop() : '').toLowerCase();
      const mimeType = (file.type || '').toLowerCase();
      const isAllowedExt = ALLOWED_DOC_EXTENSIONS.includes(ext);
      const isAllowedMime = mimeType === 'application/pdf' || isAllowedExt;

      if (!isAllowedMime) {
        setValidationError('Unsupported document format. Only PDF files are supported.');
        return;
      }

      if (file.size > MAX_DOC_SIZE_BYTES) {
        setValidationError('Document is too large. Maximum PDF size is 20 MB.');
        return;
      }

      validNewDocs.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        name: file.name || 'construction_document.pdf',
        size: file.size,
        formattedSize: formatFileSize(file.size),
      });
    }

    if (validNewDocs.length > 0) {
      setSelectedDocuments((prev) => [...prev, ...validNewDocs]);
      setValidationError(null);
    }
  };

  // Remove attached image
  const handleRemoveImage = (imgId) => {
    setSelectedImages((prev) => {
      const imgToRemove = prev.find((img) => img.id === imgId);
      if (imgToRemove?.url && imgToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imgToRemove.url);
      }
      return prev.filter((img) => img.id !== imgId);
    });
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove attached document
  const handleRemoveDocument = (docId) => {
    setSelectedDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setValidationError(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  // Handle image file input change
  const handleImageInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessImageFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Handle document file input change
  const handleDocInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessDocumentFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Drag and Drop handlers for chat composer
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const pdfFiles = files.filter(
        (f) => f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf')
      );
      const imageFiles = files.filter(
        (f) => f.type?.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name || '')
      );

      if (pdfFiles.length > 0) {
        validateAndProcessDocumentFiles(pdfFiles);
      }
      if (imageFiles.length > 0) {
        validateAndProcessImageFiles(imageFiles);
      }
      if (pdfFiles.length === 0 && imageFiles.length === 0) {
        setValidationError('Unsupported file format. Please upload PDF documents or JPG/PNG/WebP images.');
      }
    }
  };

  // Clipboard Paste handler (Ctrl+V)
  const handlePaste = (e) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    const imageFiles = [];
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const namedFile =
            file.name && file.name !== 'image.png'
              ? file
              : new File([file], `screenshot-${Date.now().toString().slice(-4)}.png`, {
                  type: file.type || 'image/png',
                });
          imageFiles.push(namedFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      validateAndProcessImageFiles(imageFiles);
    }
  };

  // Helper to convert File to base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  // Handle Send Message (Persistent in MongoDB - Task 6 & 7)
  const handleSendMessage = async (overrideText) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : chatInput;
    const hasText = textToSend.trim().length > 0;
    const hasImages = selectedImages.length > 0;
    const hasDocs = selectedDocuments.length > 0;

    if ((!hasText && !hasImages && !hasDocs) || isChatLoading) return;

    const userText = textToSend.trim();
    const attachedImages = [...selectedImages];
    const attachedDocs = [...selectedDocuments];

    // Reset composer inputs immediately
    setChatInput('');
    setSelectedImages([]);
    setSelectedDocuments([]);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';

    setIsChatLoading(true);
    if (userText.toLowerCase().includes('report')) {
      setChatLoadingText('Generating construction project report...');
    } else if (
      userText.toLowerCase().includes('briefing') ||
      userText.toLowerCase().includes('attention today')
    ) {
      setChatLoadingText('Analyzing current project operations...');
    } else if (attachedDocs.length > 0) {
      setChatLoadingText('BuildOps AI is analyzing construction document...');
    } else if (attachedImages.length > 0) {
      setChatLoadingText('Analyzing construction image...');
    } else {
      setChatLoadingText('BuildOps AI is analyzing project records...');
    }

    // Prepare local optimistic message for immediate UI rendering
    const localUserMessage = {
      role: 'user',
      content: userText || (attachedDocs.length > 0 ? `Uploaded Document: ${attachedDocs[0].name}` : `Uploaded Image: ${attachedImages[0].name}`),
      images: attachedImages.map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name,
        formattedSize: img.formattedSize,
      })),
      documents: attachedDocs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
        formattedSize: doc.formattedSize,
      })),
      createdAt: new Date().toISOString(),
    };

    // Optimistically update current active conversation
    setActiveConversationData((prev) => {
      if (!prev) return { messages: [localUserMessage] };
      return { ...prev, messages: [...prev.messages, localUserMessage] };
    });

    try {
      // 1. Prepare base64 payloads for images and PDF documents
      const preparedImages = await Promise.all(
        attachedImages.map(async (img) => {
          let base64 = '';
          if (img.file) base64 = await fileToBase64(img.file);
          return {
            data: base64,
            mimeType: img.file?.type || 'image/jpeg',
            name: img.name,
            size: img.size,
          };
        })
      );

      const preparedDocs = await Promise.all(
        attachedDocs.map(async (doc) => {
          let base64 = '';
          if (doc.file) base64 = await fileToBase64(doc.file);
          return {
            data: base64,
            mimeType: 'application/pdf',
            name: doc.name,
            size: doc.size,
          };
        })
      );

      let targetConvId = activeConvId;

      // 2. If Welcome State, create a new persistent conversation in MongoDB first (Task 6)
      if (!targetConvId) {
        const createRes = await createConversationApi({
          projectId: activeProjectId === 'all' ? null : activeProjectId,
          projectName: currentProjectName,
          title: userText ? (userText.length > 35 ? userText.slice(0, 32) + '…' : userText) : (attachedDocs[0]?.name || 'New Conversation'),
        });

        if (createRes.success && createRes.data) {
          targetConvId = createRes.data._id || createRes.data.id;
          setActiveConvId(targetConvId);
        } else {
          throw new Error('Could not initialize conversation record.');
        }
      }

      // 3. Send message payload to persistent conversation endpoint
      const response = await sendConversationMessageApi(targetConvId, {
        message: userText,
        images: preparedImages,
        documents: preparedDocs,
        projectId: activeProjectId === 'all' ? null : activeProjectId,
      });

      if (response.success && response.conversation) {
        setActiveConversationData(response.conversation);
        // Refresh sidebar conversation list to show updated title and timestamp
        loadConversations();
      } else {
        throw new Error(response.error || 'Failed to receive AI intelligence response.');
      }
    } catch (err) {
      console.warn('AI Chat API error:', err.message);
      setValidationError(err.message || 'BuildOps AI encountered an issue processing your request.');

      const fallbackText =
        attachedDocs.length > 0
          ? "BuildOps AI couldn't analyze this document right now. Please verify the PDF and try again."
          : attachedImages.length > 0
          ? "BuildOps AI couldn't analyze this image right now. Please try again."
          : "I'm BuildOps AI, focused on construction and project intelligence. Please ask a construction or project-related question.";

      const fallbackAiMessage = {
        role: 'assistant',
        content: fallbackText,
        createdAt: new Date().toISOString(),
      };

      setActiveConversationData((prev) => {
        if (!prev) return { messages: [fallbackAiMessage] };
        return { ...prev, messages: [...prev.messages, fallbackAiMessage] };
      });
    } finally {
      setIsChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Keyboard handler for Textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea height
  const handleTextareaChange = (e) => {
    setChatInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const projectListToDisplay = dbProjects.length > 0 ? dbProjects : projects;
  const currentProjectName = useMemo(() => {
    if (activeProjectId === 'all') return 'All Projects';
    const found = projectListToDisplay.find((p) => (p._id || p.id) === activeProjectId);
    return found ? found.name : 'Selected Project';
  }, [activeProjectId, projectListToDisplay]);

  // Filter conversations by search query (Task 6)
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.projectName?.toLowerCase().includes(q) ||
        c.lastMessageSnippet?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Group filtered conversations dynamically by date (Task 6)
  const conversationGroups = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  // Simple clean markdown formatter
  const renderFormattedText = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} style={{ margin: '8px 0 4px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
            {line.replace('#### ', '')}
          </h5>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ margin: '10px 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} style={{ margin: '12px 0 6px 0', fontSize: '1.08rem', fontWeight: 700, color: '#0F172A' }}>
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.trim() === '---') {
        return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '10px 0' }} />;
      }
      if (line.trim().toLowerCase() === 'potential risks' || line.trim().toLowerCase() === 'potential risks:') {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '14px 0 6px 0' }}>
            <IconAlertTriangle size={16} color="#EA580C" />
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
              Potential Risks
            </h4>
          </div>
        );
      }
      if (line.trim().toLowerCase() === 'recommended attention' || line.trim().toLowerCase() === 'recommended attention:') {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '14px 0 6px 0' }}>
            <IconCheck size={16} color="#1677D2" />
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
              Recommended Attention
            </h4>
          </div>
        );
      }
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().replace(/^[•\-\*]\s*/, '');
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '3px 0' }}>
            <span style={{ color: '#1677D2', fontWeight: 700, lineHeight: '1.5' }}>•</span>
            <span style={{ flex: 1 }}>{formatInline(bulletText)}</span>
          </div>
        );
      }
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        // Detect structured risk item e.g. "Schedule Risk — High" or "Material Risk — Medium"
        const riskMatch = numMatch[2].match(/^([A-Za-z\s]+(?:Risk)?)\s*[—–-]\s*(Critical|High|Medium|Low)(.*)/i);
        if (riskMatch) {
          const category = riskMatch[1].trim();
          const rawSeverity = riskMatch[2].trim();
          const severity = rawSeverity.charAt(0).toUpperCase() + rawSeverity.slice(1).toLowerCase();
          const remainder = riskMatch[3]?.trim();
          const severityStyles = {
            Critical: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
            High: { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
            Medium: { bg: '#FEFCE8', text: '#CA8A04', border: '#FDE047' },
            Low: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
          };
          const style = severityStyles[severity] || { bg: '#F8FAFC', text: '#475569', border: '#CBD5E1' };

          return (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 14px',
                margin: '8px 0 4px 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: remainder ? '6px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#1677D2', fontWeight: 700, fontSize: '0.85rem' }}>{numMatch[1]}.</span>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>{category}</span>
                </div>
                <span
                  style={{
                    background: style.bg,
                    color: style.text,
                    border: `1px solid ${style.border}`,
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  {severity}
                </span>
              </div>
              {remainder && (
                <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: '1.5' }}>
                  {formatInline(remainder)}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '3px 0' }}>
            <span style={{ color: '#1677D2', fontWeight: 700, minWidth: '18px', lineHeight: '1.5' }}>{numMatch[1]}.</span>
            <span style={{ flex: 1 }}>{formatInline(numMatch[2])}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }

      return (
        <p key={idx} style={{ margin: '3px 0', lineHeight: '1.55' }}>
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0F172A' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{ height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', background: '#F7F9FC', padding: '12px 16px 16px 16px', boxSizing: 'border-box' }}>
      {/* Top Workspace Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            className="btn btn-secondary btn-sm mobile-sidebar-toggle"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            style={{ display: 'none', padding: '6px 10px' }}
            aria-label="Toggle Conversation History"
          >
            <IconMenu size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              AI Project Insights
            </h1>
            <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>/</span>
            <span style={{ color: '#1677D2', fontWeight: 600, fontSize: '0.9rem' }}>BuildOps AI</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Action button to trigger on-demand Project Briefing in chat (Task 11) */}
          <button
            type="button"
            id="btn-project-briefing"
            onClick={() =>
              handleSendMessage(
                activeProjectId !== 'all'
                  ? "Give me today's project briefing."
                  : "Give me a portfolio briefing."
              )
            }
            disabled={isChatLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              color: '#1677D2',
              fontSize: '0.80rem',
              fontWeight: 600,
              cursor: isChatLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Generate an on-demand construction operations briefing"
          >
            <IconSparkles size={14} color="#1677D2" />
            <span>Project Briefing</span>
          </button>

          {/* Action button to trigger deterministic risk analysis in chat */}
          <button
            type="button"
            onClick={() =>
              handleSendMessage(
                activeProjectId !== 'all'
                  ? 'Are there any operational risks in this project?'
                  : 'Which projects currently have schedule risks?'
              )
            }
            disabled={isChatLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #FED7AA',
              background: '#FFF7ED',
              color: '#EA580C',
              fontSize: '0.80rem',
              fontWeight: 600,
              cursor: isChatLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Analyze operational and schedule risks using real project data"
          >
            <IconAlertTriangle size={14} color="#EA580C" />
            <span>Risk Check</span>
          </button>

          {/* Action button to view structured project analytics if desired */}
          {activeProjectId !== 'all' && (
            <button
              type="button"
              onClick={runAnalysis}
              disabled={isAnalyzing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                color: '#1677D2',
                fontSize: '0.80rem',
                fontWeight: 600,
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <IconSparkles size={14} color="#1677D2" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Structured Health Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Split Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ========================================================================= */}
        {/* LEFT PANEL: Real Persistent Conversation History (Task 6)                 */}
        {/* ========================================================================= */}
        <div
          className={`ai-conversation-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}
          style={{
            width: '270px',
            minWidth: '270px',
            maxWidth: '270px',
            background: '#F8FAFC',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'transform 0.25s ease',
            zIndex: 10,
          }}
        >
          {/* New Chat Button Area */}
          <div style={{ padding: '14px 14px 10px 14px' }}>
            <button
              type="button"
              onClick={handleNewChat}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1677D2';
                e.currentTarget.style.color = '#1677D2';
                e.currentTarget.style.background = '#F0F7FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.color = '#0F172A';
                e.currentTarget.style.background = '#FFFFFF';
              }}
            >
              <IconPlus size={16} color="currentColor" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search Conversations Input (Task 6) */}
          <div style={{ padding: '0 14px 12px 14px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <IconSearch size={14} color="#94A3B8" />
              </span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.78rem',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <IconX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation History Scrollable Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            {isLoadingConversations ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '0.80rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '32px 14px', textAlign: 'center', color: '#64748B' }}>
                {searchQuery ? (
                  <div style={{ fontSize: '0.82rem' }}>No conversations found.</div>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0F172A', marginBottom: '4px' }}>
                      No conversations yet.
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginBottom: '12px' }}>
                      Start a conversation with BuildOps AI.
                    </div>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1677D2',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + New Chat
                    </button>
                  </>
                )}
              </div>
            ) : (
              Object.entries(conversationGroups).map(([groupTitle, convList]) => {
                if (!convList || convList.length === 0) return null;
                return (
                  <div key={groupTitle} style={{ marginBottom: '14px' }}>
                    <div
                      style={{
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '2px 8px',
                        marginBottom: '4px',
                      }}
                    >
                      {groupTitle}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {convList.map((conv) => {
                        const convId = conv._id || conv.id;
                        const isActive = activeConvId === convId;
                        const isHovered = hoveredConvId === convId;
                        const isConfirmingDelete = deleteConfirmId === convId;

                        return (
                          <div
                            key={convId}
                            onMouseEnter={() => setHoveredConvId(convId)}
                            onMouseLeave={() => setHoveredConvId(null)}
                            style={{
                              position: 'relative',
                              borderRadius: '8px',
                              background: isActive ? '#EFF6FF' : isHovered ? '#F1F5F9' : 'transparent',
                              borderLeft: isActive ? '3px solid #1677D2' : '3px solid transparent',
                              transition: 'background 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectConversation(convId)}
                              style={{
                                flex: 1,
                                textAlign: 'left',
                                padding: '8px 10px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                minWidth: 0,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <IconMessageSquare size={14} color={isActive ? '#1677D2' : '#64748B'} />
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? '#1677D2' : '#1E293B',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={conv.title}
                                >
                                  {conv.title}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.68rem',
                                  color: '#94A3B8',
                                  marginTop: '2px',
                                  paddingLeft: '21px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {conv.projectName || 'All Projects'}
                              </div>
                            </button>

                            {/* Delete Action Button (Task 6) */}
                            {(isHovered || isActive) && !isConfirmingDelete && (
                              <button
                                type="button"
                                aria-label="Delete conversation"
                                title="Delete conversation"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(convId);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#94A3B8',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  marginRight: '6px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                              >
                                <IconTrash size={13} color="currentColor" />
                              </button>
                            )}

                            {/* Inline Delete Confirmation Dialog (Task 6) */}
                            {isConfirmingDelete && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  borderRadius: '8px',
                                  padding: '4px 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  zIndex: 5,
                                  animation: 'fadeIn 0.15s ease',
                                }}
                              >
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#991B1B' }}>
                                  Delete chat?
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{
                                      padding: '2px 6px',
                                      fontSize: '0.68rem',
                                      borderRadius: '4px',
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      color: '#475569',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteConversation(convId)}
                                    style={{
                                      padding: '2px 6px',
                                      fontSize: '0.68rem',
                                      borderRadius: '4px',
                                      border: 'none',
                                      background: '#DC2626',
                                      color: '#FFFFFF',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #E2E8F0',
              fontSize: '0.74rem',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>BuildOps AI v2.5</span>
            <span style={{ color: '#1677D2', fontWeight: 600 }}>MongoDB Connected</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Main AI Conversation Area                                    */}
        {/* ========================================================================= */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: 0,
            background: '#FFFFFF',
          }}
        >
          {/* Main Chat Header Top Bar */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Title & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: '#E0F2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1677D2',
                }}
              >
                <IconSparkles size={18} color="#1677D2" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    BuildOps AI Assistant
                  </h2>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#1677D2',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#1677D2',
                        display: 'inline-block',
                      }}
                    />
                    AI Online
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '1px' }}>
                  Construction & Project Intelligence
                </div>
              </div>
            </div>

            {/* Task 5 & 10: Real Project Selector with "Project Name — Location" Format */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#64748B' }}>
                Project:
              </span>
              <select
                id="ai-project-selector"
                value={activeProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  maxWidth: '310px',
                  outline: 'none',
                }}
              >
                <option value="all">All Projects</option>
                {projectListToDisplay.map((p) => {
                  const pId = p._id || p.id;
                  const loc = p.location ? (p.location.includes(',') ? p.location.split(',')[0].trim() : p.location) : '';
                  const label = loc ? `${p.name} — ${loc}` : p.name;
                  return (
                    <option key={pId} value={pId}>
                      {label}
                    </option>
                  );
                })}
              </select>

              {/* Task 12: Quick Generate Report Action Button */}
              <button
                type="button"
                id="btn-generate-report"
                onClick={() => handleSendMessage('Generate a project status report')}
                disabled={isChatLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  color: '#1677D2',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  cursor: isChatLoading ? 'not-allowed' : 'pointer',
                  opacity: isChatLoading ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isChatLoading) {
                    e.currentTarget.style.background = '#DBEAFE';
                    e.currentTarget.style.borderColor = '#93C5FD';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isChatLoading) {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#BFDBFE';
                  }
                }}
                title="Generate AI-powered project report using real MongoDB data"
              >
                <IconSparkles size={14} color="#1677D2" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Body OR Welcome State */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
            }}
          >
            {/* WELCOME STATE: Displayed when no conversation active or 0 messages */}
            {!activeConvId || currentMessages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  maxWidth: '680px',
                  margin: 'auto',
                  padding: '20px 0',
                }}
              >
                {/* AI Centerpiece Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1677D2',
                    marginBottom: '12px',
                    boxShadow: '0 4px 12px rgba(22, 119, 210, 0.12)',
                  }}
                >
                  <IconSparkles size={30} color="#1677D2" />
                </div>

                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 3px 0' }}>
                  BuildOps AI
                </h2>
                <div style={{ fontSize: '0.90rem', fontWeight: 600, color: '#1677D2', marginBottom: '8px' }}>
                  Construction & Project Intelligence Assistant
                </div>
                <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '520px', lineHeight: '1.5', margin: '0 0 18px 0' }}>
                  Ask questions about your construction projects, tasks, materials, schedules, risks, site documents, and inspection reports.
                </p>

                {/* 4 Suggested Prompts Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '640px',
                  }}
                >
                  {welcomePrompts.map((promptText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePromptClick(promptText)}
                      style={{
                        padding: '14px 16px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        fontWeight: 500,
                        color: '#1E293B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1677D2';
                        e.currentTarget.style.background = '#F8FAFC';
                        e.currentTarget.style.color = '#1677D2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.color = '#1E293B';
                      }}
                    >
                      <span>"{promptText}"</span>
                      <span style={{ color: '#1677D2', fontSize: '0.9rem' }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* CHAT MESSAGE STREAM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px', width: '100%', margin: '0 auto' }}>
                {/* Dashboard AI Insight Origin Banner */}
                {activeInsightBanner && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                      border: '1px solid #BAE6FD',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            background: '#0284C7',
                            color: '#FFFFFF',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          DASHBOARD AI INSIGHT
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0369A1' }}>
                          {activeInsightBanner.projectName}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
                        {activeInsightBanner.insightTitle}
                      </h3>
                      {activeInsightBanner.insightDescription && (
                        <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                          {activeInsightBanner.insightDescription}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveInsightBanner(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        lineHeight: 1,
                      }}
                      title="Dismiss insight banner"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {currentMessages.map((msg, index) => {
                  const isUser = msg.role === 'user' || msg.sender === 'user';
                  const msgText = msg.content || msg.text || '';
                  const msgImages = msg.images || (msg.imageMeta ? msg.imageMeta.map((im) => ({ ...im, formattedSize: formatFileSize(im.size) })) : []);
                  const msgDocs = msg.documents || (msg.documentMeta ? msg.documentMeta.map((dm) => ({ ...dm, formattedSize: formatFileSize(dm.size) })) : []);
                  const timeFormatted = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.timestamp || '');

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: isUser ? '#E0EEFD' : '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#1677D2',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {isUser ? 'AM' : <IconSparkles size={18} color="#1677D2" />}
                      </div>

                      {/* Message Bubble */}
                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '14px 18px',
                          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          background: isUser ? '#EFF6FF' : '#FFFFFF',
                          color: '#0F172A',
                          border: isUser ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          fontSize: '0.88rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {/* Text Content */}
                        {msgText && (
                          <div style={{ fontSize: '0.88rem' }}>
                            {isUser ? msgText : renderFormattedText(msgText)}
                          </div>
                        )}

                        {/* Task 7: Attached PDF Document Cards in Message */}
                        {msgDocs.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: msgText ? '10px' : '0',
                            }}
                          >
                            {msgDocs.map((doc, docIdx) => (
                              <div
                                key={docIdx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '7px 12px',
                                  borderRadius: '8px',
                                  background: isUser ? '#FFFFFF' : '#F8FAFC',
                                  color: '#0F172A',
                                  border: '1px solid #E2E8F0',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                }}
                              >
                                <IconFilePdf size={18} color="#E11D48" />
                                <div>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{doc.name}</div>
                                  {doc.size > 0 && (
                                    <div style={{ fontSize: '0.66rem', color: '#64748B' }}>
                                      {doc.formattedSize || formatFileSize(doc.size)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Task 2 & 3: Attached Images in Message */}
                        {msgImages.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginTop: msgText || msgDocs.length > 0 ? '10px' : '0',
                            }}
                          >
                            {msgImages.map((img, imgIdx) => {
                              if (img.url) {
                                return (
                                  <div
                                    key={imgIdx}
                                    onClick={() => setPreviewModalImage(img)}
                                    style={{
                                      cursor: 'pointer',
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      border: '1px solid #BFDBFE',
                                      background: '#FFFFFF',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      maxWidth: '180px',
                                    }}
                                    title="Click to view full image"
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.name || 'Construction image'}
                                      style={{
                                        width: '100%',
                                        height: '110px',
                                        objectFit: 'cover',
                                        display: 'block',
                                      }}
                                    />
                                    <div
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.68rem',
                                        color: '#475569',
                                        background: '#F8FAFC',
                                        borderTop: '1px solid #E2E8F0',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {img.name}
                                    </div>
                                  </div>
                                );
                              }

                              // Restored from history without binary URL
                              return (
                                <div
                                  key={imgIdx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: '#F8FAFC',
                                    borderRadius: '6px',
                                    border: '1px solid #E2E8F0',
                                    fontSize: '0.74rem',
                                    color: '#475569',
                                  }}
                                >
                                  <IconImage size={14} color="#1677D2" />
                                  <span>{img.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Task 12: Download PDF Report Banner for Generated Reports */}
                        {!isUser && msgText && (msgText.includes('PROJECT OVERVIEW') || msgText.includes('PORTFOLIO PROJECT STATUS REPORT') || msgText.includes('PORTFOLIO OVERVIEW') || msgText.includes('CONSTRUCTION PROGRESS REPORT') || msgText.includes('PROJECT STATUS REPORT')) && (
                          <div
                            style={{
                              marginTop: '12px',
                              marginBottom: '6px',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <IconFilePdf size={20} color="#EA580C" />
                              <div>
                                <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#0F172A' }}>
                                  Official BuildOps PDF Report
                                </div>
                                <div style={{ fontSize: '0.70rem', color: '#64748B' }}>
                                  A4 Standard • Enterprise Construction Operations Format
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              id="btn-download-report-pdf"
                              onClick={() => {
                                exportAiProjectReportPdf({
                                  title: msgText.includes('CONSTRUCTION PROGRESS REPORT')
                                    ? 'Construction Progress Report'
                                    : (msgText.includes('PORTFOLIO') ? 'Portfolio Project Status Report' : 'Project Status Report'),
                                  projectName: currentProjectName,
                                  content: msgText,
                                  confidence: msg.confidence || 'High',
                                  sources: msg.sources || ['Project Data', 'Task Data', 'Material Data', 'Risk Analysis'],
                                });
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                background: '#1677D2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(22, 119, 210, 0.25)',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#125EA8'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#1677D2'; }}
                            >
                              <IconFilePdf size={14} color="#FFFFFF" />
                              Download PDF Report
                            </button>
                          </div>
                        )}

                        {/* Task 10: Subtle Source Grounding & Confidence Indicator */}
                        {!isUser && ((msg.sources && msg.sources.length > 0) || msg.confidence) && (
                          <div
                            style={{
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px solid #E2E8F0',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            {/* Source badges */}
                            {msg.sources && msg.sources.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                                <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.70rem' }}>
                                  {msg.sources.length > 1 ? 'Sources:' : 'Source:'}
                                </span>
                                {msg.sources.map((src, srcIdx) => {
                                  const isDoc = src.type === 'document';
                                  const isImg = src.type === 'image';
                                  const isInfer = src.type === 'inference';
                                  const badgeBg = isDoc ? '#FFF1F2' : isImg ? '#F5F3FF' : isInfer ? '#F8FAFC' : '#EFF6FF';
                                  const badgeColor = isDoc ? '#E11D48' : isImg ? '#7C3AED' : isInfer ? '#475569' : '#1677D2';
                                  const badgeBorder = isDoc ? '#FECDD3' : isImg ? '#DDD6FE' : isInfer ? '#E2E8F0' : '#BFDBFE';

                                  return (
                                    <span
                                      key={srcIdx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '2px 7px',
                                        borderRadius: '5px',
                                        background: badgeBg,
                                        color: badgeColor,
                                        border: `1px solid ${badgeBorder}`,
                                        fontWeight: 600,
                                        fontSize: '0.70rem',
                                        lineHeight: '1.2',
                                      }}
                                    >
                                      {src.label || src.type}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Confidence Indicator */}
                            {msg.confidence && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                                <span style={{ color: '#64748B', fontSize: '0.70rem' }}>Confidence:</span>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.68rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background:
                                      msg.confidence === 'High'
                                        ? '#F0FDF4'
                                        : msg.confidence === 'Medium'
                                        ? '#FEFCE8'
                                        : '#F8FAFC',
                                    color:
                                      msg.confidence === 'High'
                                        ? '#16A34A'
                                        : msg.confidence === 'Medium'
                                        ? '#CA8A04'
                                        : '#64748B',
                                    border: `1px solid ${
                                      msg.confidence === 'High'
                                        ? '#BBF7D0'
                                        : msg.confidence === 'Medium'
                                        ? '#FDE047'
                                        : '#CBD5E1'
                                    }`,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {msg.confidence}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: '#94A3B8',
                            marginTop: '6px',
                            textAlign: isUser ? 'right' : 'left',
                          }}
                        >
                          {timeFormatted}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Follow-up Question Prompt for Dashboard Insight */}
                {activeInsightBanner && !isChatLoading && (
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: '#64748B',
                      textAlign: 'center',
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>💬</span>
                    <span>You can ask follow-up questions about this issue.</span>
                  </div>
                )}

                {/* AI Querying / Loading State */}
                {isChatLoading && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1677D2',
                        flexShrink: 0,
                      }}
                    >
                      <IconSparkles size={18} color="#1677D2" />
                    </div>
                    <div
                      style={{
                        padding: '12px 18px',
                        borderRadius: '14px 14px 14px 2px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.86rem',
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: '2px solid #BFDBFE',
                          borderTopColor: '#1677D2',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>{chatLoadingText}</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* STICKY CHAT COMPOSER / INPUT AREA                                         */}
          {/* ========================================================================= */}
          <div
            style={{
              padding: '14px 24px 18px 24px',
              background: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            {/* Hidden File Picker Inputs (Task 2 & Task 7) */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageInputChange}
            />
            <input
              type="file"
              ref={docInputRef}
              accept="application/pdf,.pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handleDocInputChange}
            />

            {/* Inline Validation Error Banner */}
            {validationError && (
              <div
                style={{
                  maxWidth: '840px',
                  margin: '0 auto 10px auto',
                  padding: '9px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconAlertTriangle size={16} color="#DC2626" />
                  <span>{validationError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  aria-label="Dismiss error"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#DC2626',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Dismiss error"
                >
                  <IconX size={14} color="#DC2626" />
                </button>
              </div>
            )}

            {/* Main Chat Composer Box with Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              style={{
                position: 'relative',
                maxWidth: '840px',
                margin: '0 auto',
                background: dragActive ? '#F0F7FF' : '#FFFFFF',
                borderRadius: '12px',
                border: dragActive ? '2px dashed #1677D2' : '1px solid #CBD5E1',
                padding: '10px 14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'border 0.15s ease, background 0.15s ease',
              }}
            >
              {/* Drag & Drop Visual Highlight Overlay */}
              {dragActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(240, 247, 255, 0.96)',
                    borderRadius: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1677D2',
                      marginBottom: '6px',
                    }}
                  >
                    <IconDocuments size={24} color="#1677D2" />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1677D2' }}>
                    Drop construction PDF document or images here
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    PDF up to 20 MB • JPG, PNG, WebP up to 10 MB
                  </div>
                </div>
              )}

              {/* Task 7: Attached PDF Document Cards Preview inside Composer */}
              {selectedDocuments.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  {selectedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        color: '#991B1B',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      <IconFilePdf size={16} color="#E11D48" />
                      <span style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        ({doc.formattedSize})
                      </span>
                      <button
                        type="button"
                        aria-label="Remove document"
                        onClick={() => handleRemoveDocument(doc.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <IconX size={12} color="#DC2626" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Task 2: Attached Images Preview inside Composer */}
              {selectedImages.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  {selectedImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        width: '100px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: 'none',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          zIndex: 2,
                        }}
                        title="Remove image"
                      >
                        <IconX size={12} color="#FFFFFF" />
                      </button>
                      <img
                        src={img.url}
                        alt={img.name}
                        onClick={() => setPreviewModalImage(img)}
                        style={{
                          width: '100px',
                          height: '76px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          display: 'block',
                        }}
                      />
                      <div
                        style={{
                          padding: '3px 6px',
                          fontSize: '0.64rem',
                          color: '#475569',
                          background: '#F1F5F9',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          borderTop: '1px solid #E2E8F0',
                        }}
                        title={`${img.name} (${img.formattedSize})`}
                      >
                        {img.name}
                      </div>
                    </div>
                  ))}

                  {selectedImages.length < 3 && (
                    <button
                      type="button"
                      aria-label="Attach another image"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100px',
                        height: '102px',
                        borderRadius: '8px',
                        border: '1.5px dashed #CBD5E1',
                        background: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: '#64748B',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      <IconPlus size={16} />
                      <span>Add image</span>
                      <span style={{ fontSize: '0.62rem', color: '#94A3B8' }}>({selectedImages.length}/3)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  selectedDocuments.length > 0 && selectedImages.length > 0
                    ? 'Ask about this document and image...'
                    : selectedDocuments.length > 0
                    ? 'Ask about this construction PDF document...'
                    : selectedImages.length > 0
                    ? 'Ask about this construction image...'
                    : 'Ask about your construction project...'
                }
                value={chatInput}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isChatLoading}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '0.90rem',
                  fontFamily: 'inherit',
                  color: '#0F172A',
                  background: 'transparent',
                  lineHeight: '1.45',
                  maxHeight: '120px',
                  boxSizing: 'border-box',
                }}
              />

              {/* Bottom Controls: Attachment Buttons & Send Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Document Attachment Button (Task 7) */}
                  <button
                    type="button"
                    aria-label="Attach PDF document"
                    title={
                      selectedDocuments.length >= 3
                        ? 'Maximum 3 documents reached'
                        : 'Attach construction document (PDF up to 20 MB)'
                    }
                    onClick={() => docInputRef.current?.click()}
                    disabled={selectedDocuments.length >= 3}
                    style={{
                      border: 'none',
                      background: selectedDocuments.length > 0 ? '#FEF2F2' : 'transparent',
                      color: selectedDocuments.length > 0 ? '#E11D48' : '#64748B',
                      cursor: selectedDocuments.length >= 3 ? 'not-allowed' : 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                    }}
                  >
                    <IconFilePdf size={16} color={selectedDocuments.length > 0 ? '#E11D48' : '#64748B'} />
                    <span>PDF</span>
                    {selectedDocuments.length > 0 && <span>({selectedDocuments.length})</span>}
                  </button>

                  {/* Image Attachment Button (Task 2 & 3) */}
                  <button
                    type="button"
                    aria-label="Attach image"
                    title={
                      selectedImages.length >= 3
                        ? 'Maximum 3 images reached'
                        : 'Attach construction image (JPG, PNG, WebP up to 10 MB)'
                    }
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedImages.length >= 3}
                    style={{
                      border: 'none',
                      background: selectedImages.length > 0 ? '#EFF6FF' : 'transparent',
                      color: selectedImages.length > 0 ? '#1677D2' : '#64748B',
                      cursor: selectedImages.length >= 3 ? 'not-allowed' : 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                    }}
                  >
                    <IconPaperclip size={16} />
                    <span>Image</span>
                    {selectedImages.length > 0 && <span>({selectedImages.length}/3)</span>}
                  </button>
                </div>

                {/* Send Button ➤ (Disabled while loading or empty) */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={
                    (!chatInput.trim() && selectedImages.length === 0 && selectedDocuments.length === 0) ||
                    isChatLoading
                  }
                  style={{
                    border: 'none',
                    background:
                      (chatInput.trim() || selectedImages.length > 0 || selectedDocuments.length > 0) &&
                      !isChatLoading
                        ? '#1677D2'
                        : '#E2E8F0',
                    color:
                      (chatInput.trim() || selectedImages.length > 0 || selectedDocuments.length > 0) &&
                      !isChatLoading
                        ? '#FFFFFF'
                        : '#94A3B8',
                    cursor:
                      (chatInput.trim() || selectedImages.length > 0 || selectedDocuments.length > 0) &&
                      !isChatLoading
                        ? 'pointer'
                        : 'not-allowed',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    boxShadow:
                      (chatInput.trim() || selectedImages.length > 0 || selectedDocuments.length > 0) &&
                      !isChatLoading
                        ? '0 2px 6px rgba(22, 119, 210, 0.25)'
                        : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Send</span>
                  <IconSend size={14} color="currentColor" />
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94A3B8', marginTop: '6px' }}>
              Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for a new line
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRESERVED: Project Health & Analytics Drawer (Optional Detailed View)      */}
      {/* ========================================================================= */}
      {isAnalysisDrawerOpen && analysisData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setIsAnalysisDrawerOpen(false)}
        >
          <div
            style={{
              width: '560px',
              maxWidth: '90vw',
              height: '100%',
              background: '#FFFFFF',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Project Health Report
                </h3>
                <div style={{ fontSize: '0.80rem', color: '#64748B' }}>
                  {projectMeta?.name || currentProjectName}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAnalysisDrawerOpen(false)}
                style={{ padding: '4px 8px' }}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Health Evaluation */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>STATUS:</div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#1677D2', marginBottom: '4px' }}>
                {analysisData.overallHealth?.status || 'Active'}
              </div>
              <p style={{ fontSize: '0.84rem', color: '#334155', margin: 0, lineHeight: '1.45' }}>
                {analysisData.overallHealth?.reason}
              </p>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>SUMMARY:</div>
              <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                {analysisData.summary}
              </p>
            </div>

            {/* Delayed Tasks */}
            {analysisData.delays && analysisData.delays.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', marginBottom: '6px' }}>
                  DELAYED TASKS ({analysisData.delays.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysisData.delays.map((d, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, color: '#991B1B' }}>{d.task}</div>
                      <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>{d.reason}</div>
                      <div style={{ color: '#1677D2', fontSize: '0.76rem', marginTop: '4px' }}>
                        Recommendation: {d.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Material Alerts */}
            {analysisData.materialAlerts && analysisData.materialAlerts.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EA580C', marginBottom: '6px' }}>
                  MATERIAL SHORTAGES ({analysisData.materialAlerts.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysisData.materialAlerts.map((m, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, color: '#9A3412' }}>{m.material} — {m.status}</div>
                      <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>
                        Stock: {m.available} / {m.required} {m.unit}
                      </div>
                      <div style={{ color: '#1677D2', fontSize: '0.76rem', marginTop: '4px' }}>
                        Action: {m.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysisData.recommendations && analysisData.recommendations.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                  RECOMMENDED ACTIONS:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {analysisData.recommendations.map((rec, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600, color: '#1677D2' }}>[{rec.priority || 'Action'}]</span> {rec.action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task 2: Lightbox Modal for full image preview */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: '#FFFFFF',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                {previewModalImage.name}
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                aria-label="Close image preview"
                style={{
                  border: 'none',
                  background: '#F1F5F9',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <IconX size={16} />
              </button>
            </div>
            <img
              src={previewModalImage.url}
              alt={previewModalImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(80vh - 60px)',
                objectFit: 'contain',
                borderRadius: '6px',
              }}
            />
          </div>
        </div>
      )}

      {/* Global CSS animation and responsive styles */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-4px); } 100% { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .mobile-sidebar-toggle { display: inline-flex !important; }
          .ai-conversation-sidebar {
            position: absolute !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 4px 0 16px rgba(0,0,0,0.12);
          }
          .ai-conversation-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AIInsights;
