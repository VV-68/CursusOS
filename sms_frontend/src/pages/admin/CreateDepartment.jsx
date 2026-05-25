import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentCreationAPI } from '../../services/api';
import PeriodCard from './PeriodCard';
import PreviewPanel from './PreviewPanel';
import JsonCourseUploadModal from '../../components/JsonCourseUploadModal';
import { applyJsonImportToForm } from '../../utils/courseJsonUtils';
import './CreateDepartment.css';

const STEPS = ['Department Info', 'Structure', 'Courses', 'Review & Submit'];
const EMPTY_COURSE = { course_name: '', course_code: '', credits: '', is_elective: false };

export default function CreateDepartment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  // ── Form State ──────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    code: '',
    department_type: 'semester_wise',
    structure_count: '',
    description: '',
    periods: []
  });

  const label = form.department_type === 'semester_wise' ? 'Semester' : 'Year';

  // ── Load Draft ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await departmentCreationAPI.getDraft();
        if (res && res.draft_data) {
          setForm(res.draft_data);
          setDraftLoaded(true);
          setTimeout(() => setDraftLoaded(false), 3000);
        }
      } catch (_) { /* no draft */ }
    })();
  }, []);

  // ── Updaters ────────────────────────────────────────────
  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const generatePeriods = useCallback(() => {
    const count = parseInt(form.structure_count) || 0;
    if (count < 1 || count > 20) return;
    const existing = form.periods || [];
    const periods = [];
    for (let i = 1; i <= count; i++) {
      const prev = existing.find(p => p.period_number === i);
      periods.push(prev || { period_number: i, courses: [{ ...EMPTY_COURSE }] });
    }
    updateField('periods', periods);
  }, [form.structure_count, form.periods]);

  const updatePeriod = (idx, updated) => {
    setForm(f => {
      const periods = [...f.periods];
      periods[idx] = updated;
      return { ...f, periods };
    });
  };

  const copyFromPrevious = (idx) => {
    if (idx < 1) return;
    setForm(f => {
      const periods = [...f.periods];
      const prev = periods[idx - 1];
      periods[idx] = {
        ...periods[idx],
        courses: (prev.courses || []).map(c => ({
          ...c,
          course_code: '', // clear codes to avoid duplicates
        }))
      };
      return { ...f, periods };
    });
  };

  // ── Validation ──────────────────────────────────────────
  const validateStep = (s) => {
    const errs = [];
    if (s === 0) {
      if (!form.name.trim()) errs.push('Department name is required');
      if (!form.code.trim()) errs.push('Department code is required');
      if (form.code.trim().length < 2) errs.push('Code must be at least 2 characters');
    }
    if (s === 1) {
      const n = parseInt(form.structure_count);
      if (!n || n < 1) errs.push(`Number of ${label.toLowerCase()}s must be at least 1`);
      if (n > 20) errs.push(`Maximum 20 ${label.toLowerCase()}s allowed`);
      if (!form.periods.length) errs.push(`Click "Generate" to create ${label.toLowerCase()} sections`);
    }
    if (s === 2) {
      // Courses are OPTIONAL — empty periods and blank courses are fine.
      // Only validate courses that have at least one field partially filled in.
      const allCodes = [];
      form.periods.forEach(p => {
        if (!p.courses) return;
        p.courses.forEach((c, ci) => {
          const hasName = c.course_name && c.course_name.trim();
          const hasCode = c.course_code && c.course_code.trim();
          const hasCredits = c.credits !== '' && c.credits !== undefined && c.credits !== null;
          const isPartial = hasName || hasCode || hasCredits;

          // Skip completely empty courses — they'll be filtered on submit
          if (!isPartial) return;

          const prefix = `${label} ${p.period_number}, Course ${ci + 1}`;
          if (!hasName) errs.push(`${prefix}: Name is required (or clear all fields to skip)`);
          if (!hasCode) errs.push(`${prefix}: Code is required (or clear all fields to skip)`);
          if (!hasCredits || isNaN(Number(c.credits)) || Number(c.credits) < 0) {
            errs.push(`${prefix}: Credits must be a non-negative number (or clear all fields to skip)`);
          }
          if (hasCode) {
            const norm = c.course_code.trim().toUpperCase();
            if (allCodes.includes(norm)) errs.push(`Duplicate course code: ${norm}`);
            allCodes.push(norm);
          }
        });
      });
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    if (step === 1 && form.periods.length === 0) generatePeriods();
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => { setErrors([]); setStep(s => Math.max(s - 1, 0)); };

  // ── Save Draft ──────────────────────────────────────────
  const saveDraft = async () => {
    setSaving(true);
    try {
      await departmentCreationAPI.saveDraft(form);
      setSuccess('Draft saved!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setErrors([e.message]);
    } finally {
      setSaving(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validate all steps
    for (let s = 0; s <= 2; s++) {
      const errs = validateStep(s);
      if (errs.length) { setErrors(errs); setStep(s); return; }
    }
    setErrors([]);
    setSubmitting(true);
    try {
      // Filter out completely empty courses before sending
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        department_type: form.department_type,
        structure_count: parseInt(form.structure_count),
        description: form.description.trim(),
        periods: form.periods.map(p => ({
          period_number: p.period_number,
          courses: (p.courses || []).filter(c =>
            (c.course_name && c.course_name.trim()) ||
            (c.course_code && c.course_code.trim())
          ).map(c => ({
            course_name: c.course_name.trim(),
            course_code: c.course_code.trim().toUpperCase(),
            credits: parseFloat(c.credits) || 0,
            is_elective: !!c.is_elective
          }))
        }))
      };
      await departmentCreationAPI.create(payload);
      setSuccess('Department created successfully!');
      setTimeout(() => navigate('/dashboard?tab=admin'), 1500);
    } catch (e) {
      const details = e.message;
      setErrors([details]);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="dept-wizard">
      {/* Header */}
      <div className="dept-wizard__header">
        <h1>🏛️ Create Department</h1>
        <div className="dept-wizard__header-actions">
          <button className="dept-btn dept-btn--secondary" onClick={saveDraft} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Draft'}
          </button>
          <button className="dept-btn dept-btn--outline" onClick={() => navigate('/dashboard?tab=admin')}>
            ← Back
          </button>
        </div>
      </div>

      {/* Draft notice */}
      {draftLoaded && (
        <div className="dept-alert dept-alert--info">
          <span className="dept-alert__icon">📝</span>
          <span>Draft restored from your previous session.</span>
        </div>
      )}

      {/* Steps */}
      <div className="dept-steps">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`dept-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            onClick={() => { if (i < step) setStep(i); }}
            style={{ cursor: i < step ? 'pointer' : 'default' }}
          >
            <span className="dept-step__num">{i < step ? '✓' : i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {errors.length > 0 && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <div>
            <strong>Please fix the following:</strong>
            <ul className="dept-alert__list">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}
      {success && (
        <div className="dept-alert dept-alert--success">
          <span className="dept-alert__icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* ── STEP 0: Department Info ────────────────────────── */}
      {step === 0 && (
        <div className="dept-card">
          <div className="dept-card__title"><span className="icon">📝</span> Department Information</div>
          <div className="dept-form-grid">
            <div className={`dept-field ${errors.some(e => e.includes('name')) ? 'has-error' : ''}`}>
              <label>Department Name *</label>
              <input
                type="text"
                placeholder="e.g. Computer Science and Engineering"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
              />
            </div>
            <div className={`dept-field ${errors.some(e => e.includes('code') || e.includes('Code')) ? 'has-error' : ''}`}>
              <label>Department Code *</label>
              <input
                type="text"
                placeholder="e.g. CSE"
                value={form.code}
                onChange={e => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                maxLength={10}
              />
              <span className="hint">{form.code.length}/10 — Letters & numbers only</span>
            </div>
            <div className="dept-field dept-form-grid--full">
              <label>Department Type *</label>
              <div className="dept-radio-group">
                <div
                  className={`dept-radio ${form.department_type === 'semester_wise' ? 'selected' : ''}`}
                  onClick={() => updateField('department_type', 'semester_wise')}
                >
                  <span className="dept-radio__emoji">📅</span>
                  <div className="dept-radio__label">Semester Wise</div>
                  <div className="dept-radio__desc">Courses organized by semesters</div>
                </div>
                <div
                  className={`dept-radio ${form.department_type === 'year_wise' ? 'selected' : ''}`}
                  onClick={() => updateField('department_type', 'year_wise')}
                >
                  <span className="dept-radio__emoji">📆</span>
                  <div className="dept-radio__label">Year Wise</div>
                  <div className="dept-radio__desc">Courses organized by academic years</div>
                </div>
              </div>
            </div>
            <div className="dept-field dept-form-grid--full">
              <label>Description (Optional)</label>
              <textarea
                placeholder="Brief description of the department..."
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                maxLength={500}
              />
              <span className="hint">{form.description.length}/500</span>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: Structure ──────────────────────────────── */}
      {step === 1 && (
        <div className="dept-card">
          <div className="dept-card__title"><span className="icon">🏗️</span> Academic Structure</div>
          <div className="dept-form-grid">
            <div className={`dept-field ${errors.some(e => e.includes('Number')) ? 'has-error' : ''}`}>
              <label>Number of {label}s *</label>
              <input
                type="number"
                min="1"
                max="20"
                placeholder={`e.g. ${form.department_type === 'semester_wise' ? '8' : '4'}`}
                value={form.structure_count}
                onChange={e => updateField('structure_count', e.target.value)}
              />
              <span className="hint">Between 1 and 20</span>
            </div>
            <div className="dept-field" style={{ justifyContent: 'flex-end' }}>
              <button
                className="dept-btn dept-btn--primary"
                onClick={generatePeriods}
                disabled={!form.structure_count || parseInt(form.structure_count) < 1}
              >
                ⚡ Generate {label} Sections
              </button>
            </div>
          </div>
          {form.periods.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="dept-alert dept-alert--info">
                <span className="dept-alert__icon">ℹ️</span>
                <span>{form.periods.length} {label.toLowerCase()} section{form.periods.length > 1 ? 's' : ''} ready. Proceed to add courses.</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {form.periods.map((p, i) => (
                  <span key={i} style={{
                    padding: '.4rem .85rem', borderRadius: '8px', fontSize: '.82rem', fontWeight: 600,
                    background: 'linear-gradient(135deg, #e6f2ff, #cce5ff)', color: '#0056b3'
                  }}>
                    {label} {p.period_number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Courses ────────────────────────────────── */}
      {step === 2 && (
        <div className="dept-card" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <div style={{ marginBottom: '1rem' }}>
            <div className="dept-card__title"><span className="icon">📚</span> Course Configuration</div>
            <p style={{ color: '#64748b', fontSize: '.88rem', margin: 0 }}>
              Add courses manually for each {label.toLowerCase()}, or import from a JSON file.
            </p>
          </div>
          <button type="button" className="dept-btn dept-btn--primary" style={{ marginBottom: '1rem' }} onClick={() => setShowJsonModal(true)}>
            📤 Upload JSON
          </button>
          {form.periods.map((period, idx) => (
            <PeriodCard
              key={period.period_number}
              period={period}
              periodIndex={idx}
              label={label}
              onUpdate={(updated) => updatePeriod(idx, updated)}
              onCopyPrevious={copyFromPrevious}
              hasPrevious={idx > 0}
            />
          ))}
        </div>
      )}

      {/* ── STEP 3: Review & Submit ────────────────────────── */}
      {step === 3 && (
        <div>
          <PreviewPanel formData={form} />
          <div className="dept-card">
            <div className="dept-card__title"><span className="icon">📦</span> Example Submission Payload</div>
            <pre style={{
              background: '#1e293b', color: '#e2e8f0', padding: '1.25rem',
              borderRadius: '10px', fontSize: '.78rem', overflow: 'auto', maxHeight: '300px'
            }}>
              {JSON.stringify({
                name: form.name, code: form.code.toUpperCase(),
                department_type: form.department_type,
                structure_count: parseInt(form.structure_count),
                description: form.description,
                periods: form.periods.map(p => ({
                  period_number: p.period_number,
                  courses: p.courses.map(c => ({
                    course_name: c.course_name, course_code: c.course_code.toUpperCase(),
                    credits: parseFloat(c.credits) || 0, is_elective: !!c.is_elective
                  }))
                }))
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="dept-footer">
        <button
          className="dept-btn dept-btn--secondary"
          onClick={prevStep}
          disabled={step === 0}
        >
          ← Previous
        </button>
        <div className="dept-footer__right">
          <button className="dept-btn dept-btn--secondary" onClick={saveDraft} disabled={saving}>
            {saving ? '⏳' : '💾'} Save Draft
          </button>
          {step < STEPS.length - 1 ? (
            <button className="dept-btn dept-btn--primary" onClick={nextStep}>
              Next →
            </button>
          ) : (
            <button
              className="dept-btn dept-btn--success dept-btn--lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '⏳ Creating...' : '🚀 Create Department'}
            </button>
          )}
        </div>
      </div>

      {showJsonModal && (
        <JsonCourseUploadModal
          label={label}
          structureCount={parseInt(form.structure_count, 10) || 0}
          onImport={(jsonData) => setForm(f => applyJsonImportToForm(jsonData, f))}
          onClose={() => setShowJsonModal(false)}
        />
      )}
    </div>
  );
}
