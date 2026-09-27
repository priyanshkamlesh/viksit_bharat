import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUpload,
  FaFile,
  FaTrash,
  FaMoon,
  FaSun,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaLightbulb,
  FaMagic,
  FaDownload,
} from 'react-icons/fa';
import { readCurrentUser } from '../lib/currentUser';

const ResumePage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const fileInputRef = useRef(null);
  const createFileInputRef = useRef(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeMode, setResumeMode] = useState('analyze');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [atsScore, setAtsScore] = useState(null);
  const [resumeFeedback, setResumeFeedback] = useState(null);
  const [generatedResume, setGeneratedResume] = useState('');
  const [generateMessage, setGenerateMessage] = useState('');
  const [createSourceResumeFile, setCreateSourceResumeFile] = useState(null);
  const [extractedDetails, setExtractedDetails] = useState(null);
  const [resumeDraft, setResumeDraft] = useState({
    full_name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    target_role: currentUser?.job_role || '',
    summary: '',
    skills: '',
    education: '',
    experience: '',
    projects: '',
    certifications: '',
  });

  const cardBase = isDark
    ? 'border border-white/10 bg-white/5 text-emerald-50 shadow-xl shadow-black/20'
    : 'border border-emerald-100 bg-white/90 text-slate-800 shadow-xl shadow-emerald-200/30';

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const isValidResumeFile = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'docx', 'txt'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return validExtensions.includes(extension) && file.size <= maxSize;
  };

  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file) return;

    if (!isValidResumeFile(file)) {
      setUploadMessage('❌ Invalid file. Please upload PDF, DOCX, or TXT (max 5MB)');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    simulateUpload(file);
  };

  const simulateUpload = (file) => {
    setIsUploading(true);
    setUploadMessage('');
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 100) progress = 100;
      setUploadProgress(progress);

      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const nextResumeFile = {
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: e.target.result,
              uploadedAt: new Date().toLocaleString(),
            };
            setResumeFile(nextResumeFile);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadMessage('✅ Resume uploaded successfully! Analyzing...');
            analyzeResume(nextResumeFile);
          };
          reader.onerror = () => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadMessage('❌ Could not read this file. Please try another resume.');
          };
          reader.readAsDataURL(file);
        }, 500);
      }
    }, 200);
  };

  const analyzeResume = async (file) => {
    if (!file?.dataUrl) {
      setUploadMessage('❌ Failed to read resume content');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_file_name: file.name,
          resume_mime_type: file.type,
          resume_file_data: file.dataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.ats_score === null || data.ats_score === undefined) {
        setAtsScore(null);
        setResumeFeedback(null);
        setUploadMessage('❌ Could not analyze your resume. Please try a different resume file.');
        setTimeout(() => setUploadMessage(''), 7000);
        return;
      }

      setAtsScore(data.ats_score);
      setResumeFeedback({
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        skills: data.skills || [],
        modelName: data.model_name || 'SentenceTransformer',
        scoringMethod: data.scoring_method || 'sentence-transformer-semantic-similarity',
        modelAvailable: Boolean(data.model_available),
        dimensionScores: data.dimension_scores || {},
      });

      // Store extracted details from the backend for pre-filling the create form
      if (data.extracted_details && Object.keys(data.extracted_details).length > 0) {
        setExtractedDetails(data.extracted_details);
      }

      setUploadMessage('✅ Resume analyzed successfully!');
      setTimeout(() => setUploadMessage(''), 3000);
    } catch (error) {
      setUploadMessage(`❌ Analysis failed: ${error.message}`);
      setTimeout(() => setUploadMessage(''), 3000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreFillFromExtracted = () => {
    if (!extractedDetails) return;

    setResumeDraft({
      full_name: extractedDetails.full_name || currentUser?.name || '',
      email: extractedDetails.email || currentUser?.email || '',
      phone: extractedDetails.phone || '',
      location: extractedDetails.location || '',
      linkedin_url: extractedDetails.linkedin_url || '',
      github_url: extractedDetails.github_url || '',
      target_role: currentUser?.job_role || '',
      summary: extractedDetails.summary || '',
      skills: extractedDetails.skills || '',
      education: extractedDetails.education || '',
      experience: extractedDetails.experience || '',
      projects: extractedDetails.projects || '',
      certifications: extractedDetails.certifications || '',
    });

    if (resumeFile?.dataUrl) {
      setCreateSourceResumeFile({
        name: resumeFile.name,
        size: resumeFile.size,
        type: resumeFile.type,
        dataUrl: resumeFile.dataUrl,
      });
    }

    setResumeMode('create');
    setGenerateMessage('✅ Form pre-filled with extracted resume details. Review, edit, and generate.');
  };

  const analyzeResumeText = async (resumeText) => {
    if (!resumeText?.trim()) {
      setGenerateMessage('Add or generate resume text before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setAtsScore(data.ats_score);
      setResumeFeedback({
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        skills: data.skills || [],
        modelName: data.model_name || 'SentenceTransformer',
        scoringMethod: data.scoring_method || 'sentence-transformer-semantic-similarity',
        modelAvailable: Boolean(data.model_available),
        dimensionScores: data.dimension_scores || {},
      });
      setGenerateMessage('Generated resume analyzed successfully.');
    } catch (error) {
      setGenerateMessage(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftChange = (field, value) => {
    setResumeDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleGenerateResume = async () => {
    const hasManualContent = Object.values(resumeDraft).some((value) => String(value || '').trim());
    if (!hasManualContent && !createSourceResumeFile?.dataUrl) {
      setGenerateMessage('Upload a previous resume or enter resume details before generating.');
      return;
    }

    setIsGenerating(true);
    setGenerateMessage('');
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resumeDraft,
          source_resume_file_name: createSourceResumeFile?.name,
          source_resume_mime_type: createSourceResumeFile?.type,
          source_resume_file_data: createSourceResumeFile?.dataUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `Server error: ${response.status}`);
      }

      setGeneratedResume(data.generated_resume || '');
      setGenerateMessage(`Resume generated with ${data.model_name || 'phi3'} via Ollama.`);
    } catch (error) {
      setGenerateMessage(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateSourceResumeSelect = (files) => {
    const file = files[0];
    if (!file) return;

    if (!isValidResumeFile(file)) {
      setGenerateMessage('Invalid file. Upload PDF, DOCX, or TXT under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCreateSourceResumeFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: event.target.result,
      });
      setGenerateMessage('Previous resume added. Phi-3 will use it as source content.');
    };
    reader.onerror = () => {
      setGenerateMessage('Could not read this resume. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadGeneratedResume = () => {
    if (!generatedResume.trim()) return;

    const blob = new Blob([generatedResume], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(resumeDraft.full_name || 'resume').replace(/\s+/g, '-').toLowerCase()}-resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDeleteResume = () => {
    setResumeFile(null);
    setAtsScore(null);
    setResumeFeedback(null);
    setExtractedDetails(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('skillnet_resume_upload');
    }
    setUploadMessage('✅ Resume deleted');
    setTimeout(() => setUploadMessage(''), 2000);
  };

  const handleOpenChatbot = () => {
    if (resumeFile?.dataUrl && typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        'skillnet_resume_upload',
        JSON.stringify({
          resume: resumeFile,
          atsScore,
          resumeFeedback,
        }),
      );
    }
    navigate('/chatbot');
  };

  return (
    <div
      className={`min-h-dvh w-full transition-colors duration-500 ${
        isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`inline-flex items-center justify-center rounded-full p-3 transition-all ${
                isDark
                  ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              <FaArrowLeft />
            </button>
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[0.35em] ${
                  isDark ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                Career Development
              </p>
              <h1 className="text-3xl font-bold">Resume Manager</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center justify-center rounded-full p-3 transition-all ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
        </div>

        <div className={`mb-6 grid gap-3 rounded-4xl p-4 sm:grid-cols-2 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white/95 ring-1 ring-emerald-100'}`}>
          <button
            type="button"
            onClick={() => setResumeMode('analyze')}
            className={`flex min-h-23 items-center gap-4 rounded-3xl px-6 py-5 text-left transition-all ${
              resumeMode === 'analyze'
                ? isDark
                  ? 'bg-emerald-400 text-[#052414] shadow-lg'
                  : 'bg-emerald-600 text-white shadow-lg'
                : isDark
                  ? 'text-emerald-100 hover:bg-white/5'
                  : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${resumeMode === 'analyze' ? 'bg-white/20' : isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
              <FaUpload />
            </span>
            <span>
              <span className="block text-base font-black">Detect ATS Score</span>
              <span className={`mt-1 block text-sm ${resumeMode === 'analyze' ? 'opacity-85' : isDark ? 'text-emerald-100/60' : 'text-slate-600'}`}>
                Upload PDF, DOCX, or TXT and get resume scoring.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setResumeMode('create')}
            className={`flex min-h-23 items-center gap-4 rounded-3xl px-6 py-5 text-left transition-all ${
              resumeMode === 'create'
                ? isDark
                  ? 'bg-emerald-400 text-[#052414] shadow-lg'
                  : 'bg-emerald-600 text-white shadow-lg'
                : isDark
                  ? 'text-emerald-100 hover:bg-white/5'
                  : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${resumeMode === 'create' ? 'bg-white/20' : isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
              <FaMagic />
            </span>
            <span>
              <span className="block text-base font-black">Create Resume</span>
              <span className={`mt-1 block text-sm ${resumeMode === 'create' ? 'opacity-85' : isDark ? 'text-emerald-100/60' : 'text-slate-600'}`}>
                Generate an ATS-ready draft with Phi-3 and Ollama.
              </span>
            </span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Upload */}
          <div className="lg:col-span-2 space-y-6">
            {resumeMode === 'analyze' && (
              <>
                <div
                  className={`rounded-4xl p-8 transition-all ${cardBase}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    borderStyle: isDragActive ? 'dashed' : 'solid',
                    borderColor: isDragActive
                      ? isDark
                        ? 'rgb(16, 185, 129)'
                        : 'rgb(5, 150, 105)'
                      : undefined,
                    backgroundColor: isDragActive ? 'rgba(16, 185, 129, 0.05)' : undefined,
                  }}
                >
                  <div className="mx-auto max-w-2xl text-center">
                    <div className="mb-4 inline-flex rounded-full bg-emerald-500/20 p-4">
                      <FaUpload className={`text-2xl ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    </div>

                    <h2 className="mb-2 text-xl font-semibold">Upload Your Resume</h2>
                    <p className={`mb-6 text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                      Drag and drop your resume here or click to browse. We'll analyze it instantly.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isAnalyzing}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all ${
                        isDark
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50'
                          : 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50'
                      }`}
                    >
                      {isUploading || isAnalyzing ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          {isAnalyzing ? 'Analyzing...' : 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <FaUpload />
                          Choose File
                        </>
                      )}
                    </button>

                    <p className={`mt-4 text-xs ${isDark ? 'text-emerald-200/50' : 'text-slate-500'}`}>
                      Supported formats: PDF, DOCX, TXT • Max size: 5MB
                    </p>
                  </div>

                  {isUploading && (
                    <div className="mt-6">
                      <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-emerald-100'}`}>
                        <div
                          className={`h-full transition-all ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className={`mt-2 text-center text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>

                {uploadMessage && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-center text-sm font-medium transition-all ${
                      uploadMessage.includes('✅')
                        ? isDark
                          ? 'border-green-500/30 bg-green-500/10 text-green-300'
                          : 'border-green-200 bg-green-50 text-green-700'
                        : isDark
                        ? 'border-red-500/30 bg-red-500/10 text-red-300'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {uploadMessage}
                  </div>
                )}

                {resumeFile && (
                  <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`rounded-lg p-3 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                          <FaFile className={`text-xl ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{resumeFile.name}</h3>
                          <p className={`text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                            {formatFileSize(resumeFile.size)} • Uploaded {resumeFile.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex rounded-full p-2 ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                        <FaCheck className={`${isDark ? 'text-green-300' : 'text-green-600'}`} />
                      </div>
                    </div>

                    {extractedDetails && Object.keys(extractedDetails).length > 0 && (
                      <div className={`mb-4 rounded-lg p-3 text-sm ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
                        <p className="font-semibold mb-1">✅ Details Extracted</p>
                        <p className="text-xs opacity-80">
                          Name, email, skills, experience, and more parsed from your resume.
                          Use them to generate an improved draft.
                        </p>
                        <button
                          type="button"
                          onClick={handlePreFillFromExtracted}
                          className={`mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            isDark
                              ? 'bg-emerald-400 text-[#052414] hover:bg-emerald-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          <FaMagic />
                          Use for Resume Creation
                        </button>
                      </div>
                    )}

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={handleOpenChatbot}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all ${
                          isDark
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <FaLightbulb />
                        Open Chatbot
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteResume}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all ${
                          isDark
                            ? 'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                            : 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {resumeMode === 'create' && (
            <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Create Your Resume</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                    Generate an ATS-ready draft with local Ollama and Phi-3.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                  phi3 + ollama
                </span>
              </div>

              <div className={`mb-5 rounded-3xl border p-4 ${isDark ? 'border-emerald-500/20 bg-black/20' : 'border-emerald-100 bg-emerald-50/50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Use Previous Resume</h3>
                    <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                      Upload an old resume and Phi-3 will reuse its real content for the new draft.
                    </p>
                  </div>
                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(event) => handleCreateSourceResumeSelect(event.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all ${
                      isDark
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                        : 'border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <FaUpload />
                    Upload Old Resume
                  </button>
                </div>

                {createSourceResumeFile && (
                  <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-emerald-100' : 'bg-white text-slate-700'}`}>
                    <span className="inline-flex items-center gap-2">
                      <FaFile />
                      {createSourceResumeFile.name} • {formatFileSize(createSourceResumeFile.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreateSourceResumeFile(null)}
                      className={isDark ? 'text-red-200 hover:text-red-100' : 'text-red-600 hover:text-red-700'}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Full Name
                  <input
                    value={resumeDraft.full_name}
                    onChange={(event) => handleDraftChange('full_name', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Target Role
                  <input
                    value={resumeDraft.target_role}
                    onChange={(event) => handleDraftChange('target_role', event.target.value)}
                    placeholder="Software Engineer"
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white placeholder:text-emerald-100/40' : 'border-emerald-100 bg-white text-slate-800 placeholder:text-slate-400'}`}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Email
                  <input
                    value={resumeDraft.email}
                    onChange={(event) => handleDraftChange('email', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Phone
                  <input
                    value={resumeDraft.phone}
                    onChange={(event) => handleDraftChange('phone', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Location
                  <input
                    value={resumeDraft.location}
                    onChange={(event) => handleDraftChange('location', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
                <label className="text-sm font-semibold">
                  LinkedIn
                  <input
                    value={resumeDraft.linkedin_url}
                    onChange={(event) => handleDraftChange('linkedin_url', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  GitHub / Portfolio
                  <input
                    value={resumeDraft.github_url}
                    onChange={(event) => handleDraftChange('github_url', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
                {[
                  ['summary', 'Career Summary'],
                  ['skills', 'Skills'],
                  ['experience', 'Experience'],
                  ['projects', 'Projects'],
                  ['education', 'Education'],
                  ['certifications', 'Certifications'],
                ].map(([field, label]) => (
                  <label key={field} className="text-sm font-semibold sm:col-span-2">
                    {label}
                    <textarea
                      value={resumeDraft[field]}
                      onChange={(event) => handleDraftChange(field, event.target.value)}
                      rows={field === 'experience' || field === 'projects' ? 4 : 3}
                      className={`mt-2 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white placeholder:text-emerald-100/40' : 'border-emerald-100 bg-white text-slate-800 placeholder:text-slate-400'}`}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerateResume}
                  disabled={isGenerating}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all ${
                    isDark
                      ? 'bg-emerald-400 text-[#052414] hover:bg-emerald-300 disabled:opacity-60'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60'
                  }`}
                >
                  {isGenerating ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                  {isGenerating ? 'Generating...' : 'Generate Resume'}
                </button>
                <button
                  type="button"
                  onClick={() => analyzeResumeText(generatedResume)}
                  disabled={!generatedResume.trim() || isAnalyzing}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all ${
                    isDark
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50'
                      : 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50'
                  }`}
                >
                  {isAnalyzing ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Analyze Draft
                </button>
                <button
                  type="button"
                  onClick={handleDownloadGeneratedResume}
                  disabled={!generatedResume.trim()}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all ${
                    isDark
                      ? 'border border-white/10 bg-white/5 text-emerald-100 hover:bg-white/10 disabled:opacity-50'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                  }`}
                >
                  <FaDownload />
                  Download TXT
                </button>
              </div>

              {generateMessage && (
                <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${generateMessage.toLowerCase().includes('failed') || generateMessage.toLowerCase().includes('ollama is not reachable') || generateMessage.toLowerCase().includes('required') ? (isDark ? 'bg-red-500/10 text-red-200' : 'bg-red-50 text-red-700') : (isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700')}`}>
                  {generateMessage}
                </p>
              )}

              {generatedResume && (
                <label className="mt-5 block text-sm font-semibold">
                  Generated Resume Draft
                  <textarea
                    value={generatedResume}
                    onChange={(event) => setGeneratedResume(event.target.value)}
                    rows={18}
                    className={`mt-2 w-full resize-y rounded-3xl border px-4 py-3 font-mono text-xs leading-6 outline-none ${isDark ? 'border-white/10 bg-black/30 text-emerald-50' : 'border-emerald-100 bg-white text-slate-800'}`}
                  />
                </label>
              )}
            </div>
            )}

            {/* Tips Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                <h3 className="mb-2 font-semibold">Resume Tips</h3>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                  <li>• Keep it to 1-2 pages</li>
                  <li>• Use clear formatting</li>
                  <li>• Highlight achievements</li>
                  <li>• Include relevant skills</li>
                </ul>
              </div>
              <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                <h3 className="mb-2 font-semibold">Supported Formats</h3>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                  <li>✓ PDF (.pdf)</li>
                  <li>✓ Microsoft Word (.docx)</li>
                  <li>✓ Plain Text (.txt)</li>
                  <li>✓ Max 5MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis Results */}
          {atsScore !== null && resumeFeedback && (
            <div className="space-y-6">
              {/* ATS Score Card */}
              <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                <h3 className="mb-4 font-semibold">ATS Score</h3>
                <p className={`mb-4 text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-emerald-300/70' : 'text-emerald-700/70'}`}>
                  SentenceTransformer: {resumeFeedback.modelName}
                </p>
                {!resumeFeedback.modelAvailable && resumeFeedback.scoringMethod === 'rule-based-fallback' && (
                  <p className={`mb-4 rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-yellow-400/10 text-yellow-200' : 'bg-yellow-50 text-yellow-700'}`}>
                    Model download is pending, so this result uses a local fallback until the SentenceTransformer model is available.
                  </p>
                )}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <div
                      className={`text-5xl font-bold ${
                        atsScore >= 75
                          ? isDark
                            ? 'text-green-400'
                            : 'text-green-600'
                          : atsScore >= 50
                          ? isDark
                            ? 'text-yellow-400'
                            : 'text-yellow-600'
                          : isDark
                          ? 'text-red-400'
                          : 'text-red-600'
                      }`}
                    >
                      {atsScore}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>/100</p>
                  </div>
                  <div className="flex-1">
                    <div
                      className={`h-32 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-emerald-100'}`}
                    >
                      <div
                        className={`h-full w-4 transition-all ${
                          atsScore >= 75
                            ? isDark
                              ? 'bg-green-400'
                              : 'bg-green-500'
                            : atsScore >= 50
                            ? isDark
                              ? 'bg-yellow-400'
                              : 'bg-yellow-500'
                            : isDark
                            ? 'bg-red-400'
                            : 'bg-red-500'
                        }`}
                        style={{ height: `${atsScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {resumeFeedback.dimensionScores && Object.keys(resumeFeedback.dimensionScores).length > 0 && (
                <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                  <h3 className={`mb-4 font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    ATS Dimensions
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(resumeFeedback.dimensionScores).map(([dimension, score]) => (
                      <div key={dimension}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold">
                          <span className="capitalize">{dimension.replaceAll('_', ' ')}</span>
                          <span>{Math.round(score)}/100</span>
                        </div>
                        <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-emerald-100'}`}>
                          <div
                            className={isDark ? 'h-full bg-emerald-400' : 'h-full bg-emerald-500'}
                            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {resumeFeedback.strengths && resumeFeedback.strengths.length > 0 && (
                <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                  <h3 className={`mb-4 font-semibold flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    <FaCheck /> Strengths
                  </h3>
                  <ul className={`space-y-3 text-sm`}>
                    {resumeFeedback.strengths.map((strength, idx) => (
                      <li key={idx} className={`flex gap-3 ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                        <span className={`shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`}>✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {resumeFeedback.improvements && resumeFeedback.improvements.length > 0 && (
                <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                  <h3 className={`mb-4 font-semibold flex items-center gap-2 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    <FaLightbulb /> Improvements
                  </h3>
                  <ul className={`space-y-3 text-sm`}>
                    {resumeFeedback.improvements.map((improvement, idx) => (
                      <li key={idx} className={`flex gap-3 ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                        <span className={`shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {resumeFeedback.skills && resumeFeedback.skills.length > 0 && (
                <div className={`rounded-4xl p-6 transition-all ${cardBase}`}>
                  <h3 className={`mb-4 font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    Detected Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeFeedback.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          isDark
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumePage;