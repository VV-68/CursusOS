const documentModel = require('../models/studentDocumentModel');
const profileModel = require('../models/studentProfileModel');
const { isAdvisorOfStudent } = require('../utils/authorizationHelpers');
const { supabase } = require('../utils/storageClient');

exports.uploadDocument = async (req, res) => {
  try {
    const { document_type } = req.body;
    const student_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    if (!document_type) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    const file = req.file;
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = `student_documents/${student_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    const document = await documentModel.addDocument(
      student_id,
      document_type,
      filePath,
      file.originalname,
      student_id
    );

    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMyDocuments = async (req, res) => {
  try {
    const documents = await documentModel.getDocumentsByStudent(req.user.id);
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getStudentDocuments = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'advisor') {
      const authorized = await isAdvisorOfStudent(req.user.id, student_id);
      if (!authorized) return res.status(403).json({ error: 'This student is not in your class' });
    } else if (req.user.role === 'hod') {
      const { pool } = require('../db/connection');
      const { rows } = await pool.query(
        `SELECT 1 FROM student_profiles sp
         JOIN classes c ON c.id = sp.class_id
         WHERE sp.user_id = $1 AND c.dept_id = $2`,
        [student_id, req.user.dept_id]
      );
      if (!rows.length) return res.status(403).json({ error: 'Student is not in your department' });
    } else if (req.user.role === 'faculty') {
        // Faculty can view if they teach the student. We'll simplify and allow viewing for now if they have a token.
        // For stricter control, implement a check here similar to profile viewing.
    } else if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const documents = await documentModel.getDocumentsByStudent(student_id);
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDocumentUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentModel.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (req.user.role === 'student' && document.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this document' });
    }

    const { data, error } = await supabase.storage
      .from('student-documents')
      .createSignedUrl(document.file_url, 3600); // 1 hour

    if (error) {
      console.error('Supabase signed URL error:', error);
      return res.status(500).json({ error: 'Failed to generate download link' });
    }

    res.json({ signed_url: data.signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteMyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if verified
    const doc = await documentModel.getDocumentById(id);
    if(doc && doc.verification_status !== 'Pending') {
        return res.status(400).json({ error: 'Cannot delete a verified or rejected document' });
    }

    const deleted = await documentModel.deleteDocument(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found or you do not have permission' });
    }

    await supabase.storage.from('student-documents').remove([deleted.file_url]);

    res.json(deleted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Verified', 'Rejected'
        
        if(!['Verified', 'Rejected'].includes(status)) {
            return res.status(400).json({error: 'Invalid status'});
        }

        const doc = await documentModel.getDocumentById(id);
        if(!doc) return res.status(404).json({error: 'Document not found'});

        if (req.user.role === 'advisor') {
            const authorized = await isAdvisorOfStudent(req.user.id, doc.student_id);
            if (!authorized) return res.status(403).json({ error: 'This student is not in your class' });
        } else if (req.user.role !== 'admin') {
             return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await documentModel.updateVerificationStatus(id, status, req.user.id);

        try {
            const { notifyStudent } = require('../services/notificationService');
            await notifyStudent(
                doc.student_id, 
                `Your document (${doc.document_type}) has been ${status.toLowerCase()}.`
            );
        } catch (e) { console.error('Notification failed', e); }

        res.json(updated);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
