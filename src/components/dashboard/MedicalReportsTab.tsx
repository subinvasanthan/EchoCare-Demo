import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Upload, Search, Send, Eye, Loader2, Trash2 } from 'lucide-react';

export default function MedicalReportsTab({ user }: { user: any }) {
  const [patients, setPatients] = useState<Array<{ id: string; full_name: string }>>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [uploadPatient, setUploadPatient] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [answerSources, setAnswerSources] = useState<Array<{ name: string }>>([]);

  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<Array<{
    id: string;
    name: string;
    uploadedAt: string;
    status: string;
    summary?: string;
    url?: string;
  }>>([]);

  const [reportsLoading, setReportsLoading] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from('care_recipients')
        .select('id, full_name')
        .eq('owner_id', user.id)
        .order('full_name');
      if (!error) setPatients(data || []);
    };
    fetchPatients();
  }, [user]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase();
    return !q
      ? patients
      : patients.filter(p => p.full_name.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  useEffect(() => {
    if (!uploadPatient && selectedPatient) {
      setUploadPatient(selectedPatient);
    }
  }, [selectedPatient, uploadPatient]);

  const refreshReports = useCallback(
    async (patientId: string) => {
      if (!patientId) return;
      setReportsLoading(true);
      try {
        const { data, error } = await supabase
          .from('medical_reports')
          .select('id, file_name, storage_path, external_url, status, summary_text, file_type, created_at')
          .eq('patient_id', patientId)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setReports(
          (data ?? []).map((item) => ({
            id: item.id,
            name: item.file_name ?? 'Unknown report',
            uploadedAt: item.created_at ?? new Date().toISOString(),
            status: String(item.status ?? 'Pending'),
            summary: item.summary_text ?? '',
            url: item.storage_path ?? item.external_url ?? undefined,
          }))
        );
      } catch (err) {
        console.error('Failed to load medical reports', err);
      } finally {
        setReportsLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    const target = uploadPatient || selectedPatient;
    if (!target) {
      setReports([]);
      return;
    }
    refreshReports(target);
  }, [uploadPatient, selectedPatient, refreshReports]);

  const askWebhook = import.meta.env.VITE_N8N_REPORTS_ASK_WEBHOOK_URL as string | undefined;
  const uploadWebhook = import.meta.env.VITE_N8N_REPORTS_UPLOAD_WEBHOOK_URL as string | undefined;

  const submitQuestion = async () => {
    if (!selectedPatient || !question.trim() || !askWebhook) return;
    setAsking(true);
    setAnswer('');
    setAnswerSources([]);
    try {
      const res = await fetch(askWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          patient_id: selectedPatient,
          question,
        }),
      });
      if (!res.ok) throw new Error(`Ask failed ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json();
        setAnswer(j.answer || '');
        setAnswerSources(Array.isArray(j.sources) ? j.sources : []);
      } else {
        setAnswer(await res.text());
      }
    } catch (_e) {
      setAnswer('Unable to get an answer right now.');
    } finally {
      setAsking(false);
    }
  };

  const isAllowedReportFile = (file: File) => {
    const allowedMime = ['application/pdf', 'image/jpeg'];
    const allowedExt = ['pdf', 'jpg', 'jpeg'];
    if (allowedMime.includes(file.type)) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return !!ext && allowedExt.includes(ext);
  };

  const onFilesSelected = async (picked: FileList | null, targetPatient: string) => {
    if (!picked || !uploadWebhook) return;
    if (!targetPatient) {
      window.alert('Please select a patient before uploading a report.');
      return;
    }
    const patientInfo = patients.find(p => p.id === targetPatient);
    setUploading(true);
    const nextReports: typeof reports = [...reports];
    try {
      for (const file of Array.from(picked)) {
        if (!isAllowedReportFile(file)) {
          window.alert('Only PDF and JPEG reports are allowed.');
          continue;
        }
        const tempId = `${Date.now()}-${file.name}`;
        nextReports.unshift({
          id: tempId,
          name: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'Pending',
          summary: '',
        });
        setReports([...nextReports]);

        const form = new FormData();
        form.append('file', file);
        form.append('user_id', user.id);
        form.append('patient_id', targetPatient);
        if (patientInfo) {
          form.append('patient_full_name', patientInfo.full_name);
          form.append('patient_details', JSON.stringify(patientInfo));
        }

        const res = await fetch(uploadWebhook, { method: 'POST', body: form });
        if (!res.ok) {
          const idx = nextReports.findIndex(f => f.id === tempId);
          if (idx >= 0) nextReports[idx].status = 'Error';
          setReports([...nextReports]);
          continue;
        }
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const j = await res.json();
          const idx = nextReports.findIndex(f => f.id === tempId);
          if (idx >= 0) {
            nextReports[idx].status = j.status || 'Pending';
            nextReports[idx].summary = j.summary_text || j.summary || '';
            nextReports[idx].url = j.storage_path || j.external_url || nextReports[idx].url;
          }
        } else {
          const text = await res.text();
          const idx = nextReports.findIndex(f => f.id === tempId);
          if (idx >= 0) {
            nextReports[idx].status = 'Pending';
            nextReports[idx].summary = text;
          }
        }
        setReports([...nextReports]);
      }
      await refreshReports(targetPatient);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    const target = uploadPatient || selectedPatient;
    if (!target) return;
    const confirmDelete = window.confirm('Do you want to delete this report?');
    if (!confirmDelete) return;
    try {
      const { error } = await supabase
        .from('medical_reports')
        .delete()
        .eq('id', reportId)
        .eq('patient_id', target);
      if (error) throw error;
      setReports((prev) => prev.filter((item) => item.id !== reportId));
    } catch (err) {
      console.error('Unable to delete report', err);
      window.alert('Unable to delete this report right now. Please try again later.');
    }
  };

  const getStatusStyles = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (['processed', 'completed', 'ready', 'success'].includes(normalized)) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    }
    if (['pending', 'processing', 'queued'].includes(normalized)) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
    }
    if (['error', 'failed'].includes(normalized)) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    }
    return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  };

  const parsedAnswer = useMemo(() => {
    if (!answer) return { text: '', linkText: '', linkHref: '' };
    let linkValue = '';
    const content: string[] = [];
    answer.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^\*\*?\s*report link\s*:/i.test(trimmed)) {
        linkValue = trimmed.replace(/^\*\*?\s*report link\s*:\s*/i, '').replace(/\*\*$/, '').trim();
      } else {
        content.push(trimmed.replace(/^\*\*?\s*answer\s*:\s*/i, '').replace(/\*\*/g, '').trim());
      }
    });
    const text = content.filter(Boolean).join('\n').trim();
    let href = linkValue;
    if (href) {
      href = href.replace(/^\*+\s*/, '').trim();
      if (!/^https?:\/\//i.test(href)) {
        href = `https://${href}`;
      }
      href = encodeURI(href);
    }
    return {
      text: text || answer,
      linkText: linkValue,
      linkHref: href,
    };
  }, [answer]);

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Ask Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ask About Reports</h3>
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Patient</label>
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Search patient..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full mb-4 px-4 py-2 rounded-xl bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">Choose a patient</option>
            {filteredPatients.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ask a question</label>
          <textarea
            className="w-full mb-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            rows={3}
            placeholder="Ask a question about this patient’s reports…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            onClick={submitQuestion}
            disabled={!selectedPatient || !question.trim() || asking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white min-h-[44px]"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {asking ? 'Processing…' : 'Ask'}
          </button>

          {!!answer && (
            <div className="mt-5 p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-gray-900 dark:text-gray-100 border border-teal-200 dark:border-teal-800">
              <div className="font-semibold mb-2">Answer</div>
              <div className="whitespace-pre-wrap">{parsedAnswer.text}</div>
              {parsedAnswer.linkHref && (
                <div className="mt-3">
                  <a
                    href={parsedAnswer.linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    View related report
                  </a>
                </div>
              )}
              {!!answerSources.length && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Sources: {answerSources.map((s, i) => <span key={i} className="mr-2">{s.name}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Reports</h3>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select patient for upload
              </label>
              <select
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                value={uploadPatient}
                onChange={(e) => setUploadPatient(e.target.value)}
              >
                <option value="">Choose a patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Report</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                className="hidden"
                multiple
                onChange={(e) => onFilesSelected(e.target.files, uploadPatient)}
              />
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()} 
            onDrop={(e) => {
              e.preventDefault();
              onFilesSelected(e.dataTransfer.files, uploadPatient);
            }}
            className="mb-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-600 dark:text-gray-300"
          >
            Drag & drop files here, or use the Upload button.
          </div>

          {(uploading || reportsLoading) && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {uploading ? 'Uploading…' : 'Loading reports…'}
            </div>
          )}

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900 text-left text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="py-2 pr-4 w-48 bg-white dark:bg-gray-900">Report</th>
                  <th className="py-2 pr-4 w-64 bg-white dark:bg-gray-900">Summary</th>
                  <th className="py-2 pr-4 bg-white dark:bg-gray-900">Status</th>
                  <th className="py-2 pr-4 bg-white dark:bg-gray-900">Uploaded</th>
                  <th className="py-2 pr-4 bg-white dark:bg-gray-900">Report Link</th>
                  <th className="py-2 pr-4 bg-white dark:bg-gray-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-900 dark:text-gray-100">
                {reports.map((f) => (
                  <tr key={f.id} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="py-2 pr-4 w-48 max-w-48 truncate" title={f.name}>{f.name}</td>
                    <td className="py-2 pr-4 pl-4 w-64">
                      {f.summary ? (
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => { setSummaryText(f.summary || ''); setSummaryOpen(true); }}
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyles(f.status)}`}>
                        {(f.status || 'Pending').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 pr-4 max-w-40 truncate" title={new Date(f.uploadedAt).toLocaleString()}>{new Date(f.uploadedAt).toLocaleString()}</td>
                    <td className="py-2 pr-4 max-w-36 truncate">
                      {f.url ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 w-24 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30 transition-colors"
                        onClick={() => handleDeleteReport(f.id)}
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!reports.length && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">No reports uploaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Summary</h3>
              <button
                onClick={() => setSummaryOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >✕</button>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">{summaryText}</pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-right">
              <button
                onClick={() => setSummaryOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


