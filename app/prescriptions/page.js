'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers';
import { useToast } from '../providers';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchPrescriptions();
  }, [user, authLoading]);

  async function fetchPrescriptions() {
    try {
      const res = await fetch('/api/prescriptions');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch {
      addToast('Failed to load prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function validateAndSetFile(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      addToast('Please upload a JPG, PNG, or PDF file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('File size must be under 5MB', 'error');
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      addToast('Please select a file first', 'warning');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const res = await fetch('/api/prescriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: base64, notes }),
          });
          if (res.ok) {
            addToast('Prescription uploaded successfully! Our pharmacist will review it shortly.', 'success');
            setSelectedFile(null);
            setNotes('');
            if (fileRef.current) fileRef.current.value = '';
            fetchPrescriptions();
          } else {
            const data = await res.json();
            addToast(data.error || 'Upload failed', 'error');
          }
        } catch {
          addToast('Upload failed', 'error');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      addToast('Upload failed', 'error');
      setUploading(false);
    }
  }

  async function handleDelete(rxId) {
    if (!confirm('Delete this prescription?')) return;
    try {
      const res = await fetch(`/api/prescriptions/${rxId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Prescription deleted', 'success');
        fetchPrescriptions();
      } else {
        addToast('Failed to delete', 'error');
      }
    } catch {
      addToast('Failed to delete', 'error');
    }
  }

  if (authLoading || loading) {
    return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;
  }

  const pending = prescriptions.filter(p => p.status === 'pending');
  const approved = prescriptions.filter(p => p.status === 'approved');
  const rejected = prescriptions.filter(p => p.status === 'rejected');

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link><span>/</span><span>Prescriptions</span>
          </div>
          <h1 className="page-title"><i className="bi bi-file-earmark-medical" style={{ color: 'var(--primary)' }}></i> My Prescriptions</h1>
          <p className="page-sub">Upload prescriptions for medicines that require a doctor&apos;s approval</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="prescriptions-layout">
            {/* Upload Section */}
            <div>
              <div className="upload-card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-cloud-arrow-up" style={{ color: 'var(--primary)' }}></i> Upload Prescription
                </h3>

                <div
                  className={`file-upload-zone ${dragOver ? 'dragover' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                  />
                  <div className="upload-icon"><i className="bi bi-cloud-arrow-up"></i></div>
                  {selectedFile ? (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 4 }}>
                        <i className="bi bi-check-circle-fill"></i> {selectedFile.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                        Drag & drop your prescription here
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        or click to browse — JPG, PNG, PDF (max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="form-group mt-16">
                  <label className="form-label">Notes (optional)</label>
                  <textarea
                    className="form-control"
                    placeholder="Any notes for the pharmacist..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  ></textarea>
                </div>

                <button
                  className="btn btn-primary btn-block mt-12"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Uploading...</>
                  ) : (
                    <><i className="bi bi-upload"></i> Upload Prescription</>
                  )}
                </button>
              </div>

              {/* Info Box */}
              <div style={{ background: 'var(--primary-light)', borderRadius: 12, padding: 20, border: '1px solid rgba(15,110,86,.15)', marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--primary)' }}>
                  <i className="bi bi-info-circle"></i> How it works
                </h4>
                <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--gray-600)', lineHeight: 2 }}>
                  <li>Upload a clear photo or PDF of your prescription</li>
                  <li>Our pharmacist will review it within a few hours</li>
                  <li>Once approved, you can add prescription medicines to your cart</li>
                  <li>If rejected, you&apos;ll see the reason and can re-upload</li>
                </ol>
              </div>
            </div>

            {/* Prescriptions List */}
            <div>
              {prescriptions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><i className="bi bi-file-earmark-medical"></i></div>
                  <h3>No Prescriptions Yet</h3>
                  <p>Upload your first prescription to get started</p>
                </div>
              ) : (
                <>
                  {/* Pending */}
                  {pending.length > 0 && (
                    <div className="mb-24">
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="status-badge status-pending">Pending Review</span>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>({pending.length})</span>
                      </h3>
                      <div className="prescriptions-list">
                        {pending.map(rx => (
                          <RxCard key={rx.id} rx={rx} onDelete={handleDelete} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approved */}
                  {approved.length > 0 && (
                    <div className="mb-24">
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="status-badge status-approved">Approved</span>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>({approved.length})</span>
                      </h3>
                      <div className="prescriptions-list">
                        {approved.map(rx => (
                          <RxCard key={rx.id} rx={rx} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected */}
                  {rejected.length > 0 && (
                    <div className="mb-24">
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="status-badge status-rejected">Rejected</span>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>({rejected.length})</span>
                      </h3>
                      <div className="prescriptions-list">
                        {rejected.map(rx => (
                          <RxCard key={rx.id} rx={rx} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RxCard({ rx, onDelete }) {
  const isImage = rx.file && (rx.file.includes('image/') || rx.file.match(/\.(jpg|jpeg|png|gif|webp)/i));
  const isPdf = rx.file && (rx.file.includes('application/pdf') || rx.file.match(/\.pdf/i));

  return (
    <div className="rx-card">
      <div className="rx-file-preview">
        {isImage ? (
          <i className="bi bi-image" style={{ fontSize: 24, color: 'var(--primary)' }}></i>
        ) : isPdf ? (
          <div className="rx-pdf-icon">
            <i className="bi bi-file-pdf"></i>
            <span>PDF</span>
          </div>
        ) : (
          <i className="bi bi-file-earmark" style={{ fontSize: 24, color: 'var(--gray-400)' }}></i>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className={`status-badge status-${rx.status}`}>
            {rx.status === 'pending' ? 'Pending Review' : rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            {new Date(rx.uploaded_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        {rx.notes && (
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 4 }}>
            <strong>Notes:</strong> {rx.notes}
          </p>
        )}
        {rx.admin_notes && (
          <p style={{ fontSize: 13, color: rx.status === 'rejected' ? 'var(--danger)' : 'var(--success)', marginBottom: 4 }}>
            <strong>Pharmacist:</strong> {rx.admin_notes}
          </p>
        )}
        {rx.medicines && rx.medicines.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {rx.medicines.map(m => (
              <span key={m.id} className="badge badge-primary">{m.name}</span>
            ))}
          </div>
        )}
      </div>
      {rx.status === 'pending' && onDelete && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onDelete(rx.id)}
          title="Delete"
          style={{ color: 'var(--danger)', flexShrink: 0 }}
        >
          <i className="bi bi-trash"></i>
        </button>
      )}
    </div>
  );
}
