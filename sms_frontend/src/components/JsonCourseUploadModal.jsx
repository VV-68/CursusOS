import { useState, useRef } from 'react';
import { buildSampleJSON, normalizeJsonPeriods } from '../utils/courseJsonUtils';
import '../pages/admin/CreateDepartment.css';

export default function JsonCourseUploadModal({ label, structureCount, onImport, onClose }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const sample = buildSampleJSON(label, structureCount);
  const sampleStr = JSON.stringify(sample, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const processFile = (f) => {
    setFile(f);
    setError('');
    setParsed(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.periods || !Array.isArray(json.periods)) {
          setError('Invalid format: JSON must have a "periods" array. See the sample above.');
          return;
        }
        for (const p of json.periods) {
          if (!p.period_number || !Array.isArray(p.courses)) {
            setError('Each period must have "period_number" (integer) and "courses" (array).');
            return;
          }
        }
        setParsed({ periods: normalizeJsonPeriods(json.periods) });
      } catch {
        setError('Failed to parse JSON. Please check the file format.');
      }
    };
    reader.readAsText(f);
  };

  const allCourses = parsed
    ? parsed.periods.flatMap(p => p.courses.map(c => ({ ...c, period_number: p.period_number })))
    : [];
  const totalCredits = allCourses.reduce((s, c) => s + (parseFloat(c.credits) || 0), 0);

  return (
    <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="json-upload-modal">
        <div className="json-upload-modal__header">
          <h2>📤 Import Courses from JSON</h2>
          <button type="button" className="json-upload-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="json-upload-modal__body">
          <div className="json-sample-section">
            <h3>📋 Sample JSON Structure</h3>
            <p>
              Each <strong>period</strong> maps to a {label.toLowerCase()} (<code>period_number</code> = 1, 2, 3…).
              Missing fields use defaults: code <code>0101</code>, name <code>course0101</code>, credits <code>0</code>.
            </p>
            <ul className="json-field-legend">
              <li><code>period_number</code> — {label} number (required)</li>
              <li><code>course_name</code> — optional (default: <code>course0101</code>)</li>
              <li><code>course_code</code> — optional (default: <code>0101</code>)</li>
              <li><code>credits</code> — optional (default: <code>0</code>)</li>
              <li><code>is_elective</code> — optional (default: <code>false</code>)</li>
            </ul>
            {structureCount > 4 && (
              <p className="json-sample-note">
                Sample shows 4 of {structureCount} {label.toLowerCase()}s.
              </p>
            )}
            <div className="json-sample-block">
              <div className="json-sample-block__header">
                <span>courses.json</span>
                <button type="button" className={`json-sample-block__copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre>{sampleStr}</pre>
            </div>
          </div>

          <div className="json-sample-section">
            <h3>📁 Upload Your JSON File</h3>
            <div
              className={`json-upload-zone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
              }}
            >
              <span className="json-upload-zone__icon">📄</span>
              <div className="json-upload-zone__text">
                {file ? 'File selected — click to change' : 'Click to browse or drag & drop'}
              </div>
              <div className="json-upload-zone__hint">Accepts .json files only</div>
              {file && <div className="json-upload-zone__file">📎 {file.name}</div>}
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} />
            </div>
          </div>

          {error && <div className="json-upload-error">⚠️ {error}</div>}

          {parsed && (
            <div className="json-sample-section">
              <h3>✅ Preview ({allCourses.length} courses)</h3>
              <div className="json-preview-stats">
                <div className="json-preview-stats__item"><strong>{parsed.periods.length}</strong> {label}s</div>
                <div className="json-preview-stats__item"><strong>{allCourses.length}</strong> Courses</div>
                <div className="json-preview-stats__item"><strong>{totalCredits}</strong> Credits</div>
              </div>
              <table className="json-preview-table">
                <thead>
                  <tr>
                    <th>{label}</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Credits</th>
                    <th>Elective</th>
                  </tr>
                </thead>
                <tbody>
                  {allCourses.map((c, i) => (
                    <tr key={i}>
                      <td><span className="period-badge">{c.period_number}</span></td>
                      <td>{c.course_name}</td>
                      <td><code>{c.course_code}</code></td>
                      <td>{c.credits}</td>
                      <td>
                        <span className={`elective-badge ${c.is_elective ? 'yes' : 'no'}`}>
                          {c.is_elective ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="json-upload-modal__footer">
          <button type="button" className="dept-btn dept-btn--secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="dept-btn dept-btn--success"
            disabled={!parsed}
            onClick={() => { onImport(parsed); onClose(); }}
          >
            ✅ Import {allCourses.length ? `${allCourses.length} Courses` : 'Courses'}
          </button>
        </div>
      </div>
    </div>
  );
}
