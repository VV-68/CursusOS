import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteStudent } from '../services/api';

function StudentTable({ students, onRefresh }) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteStudent(id);
      onRefresh?.();
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  if (!students || students.length === 0) {
    return <div className="empty-state">No students found</div>;
  }

  return (
    <div className="table-container">
      <table className="student-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Marks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.department}</td>
              <td>{s.marks}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-edit"
                  onClick={() => navigate(`/edit/${s.id}`)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;
