'use client';

interface AdminInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminInstructionsModal({ isOpen, onClose }: AdminInstructionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">📚 Admin Panel Guide</h2>
            <p className="text-indigo-100 text-sm mt-1">שיפור תכונות הניהול וניהול תוכן</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-500 p-2 rounded transition text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Users Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">👥 Users Tab</h3>
            <p className="text-gray-700 mb-3">Manage all users and their roles</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>View all users</strong> - See email, role, location, last login</li>
              <li>✅ <strong>Change roles</strong> - Promote users to admin or super_admin</li>
              <li>✅ <strong>Delete users</strong> - Remove inactive or test accounts</li>
              <li>⚠️ <strong>Note:</strong> ikrigel@gmail.com is protected and cannot be deleted</li>
            </ul>
          </section>

          {/* Courses Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">🎓 Courses Tab</h3>
            <p className="text-gray-700 mb-3">Create and manage learning courses</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>Create courses</strong> - Add new courses like &quot;דיני תעבורה&quot; or &quot;נהלי רישוי&quot;</li>
              <li>✅ <strong>Add descriptions</strong> - Help users understand the course</li>
              <li>✅ <strong>Organize questions</strong> - Link questions to courses</li>
              <li>💡 <strong>Tip:</strong> Create multiple courses to organize content by topic</li>
            </ul>
          </section>

          {/* Questions Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">❓ Questions Tab</h3>
            <p className="text-gray-700 mb-3">Create questions and assign to courses</p>
            <div className="bg-purple-50 p-4 rounded-lg mb-3">
              <p className="font-semibold text-purple-900 mb-2">Question Types:</p>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>📝 <strong>Free Text:</strong> Users type their answer</li>
                <li>❓ <strong>Multiple Choice:</strong> Users select from options</li>
              </ul>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>Select type</strong> - Choose free text or multiple choice</li>
              <li>✅ <strong>Add to multiple courses</strong> - Same question in multiple courses</li>
              <li>✅ <strong>Set difficulty</strong> - Easy, Medium, or Hard</li>
              <li>✅ <strong>View all questions</strong> - See which courses each question is in</li>
            </ul>
          </section>

          {/* Document Sources Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">📚 Document Sources Tab</h3>
            <p className="text-gray-700 mb-3">Upload and manage RAG documents</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>Upload documents</strong> - Add PDF or text files</li>
              <li>✅ <strong>Auto-embedding</strong> - Documents are automatically embedded for search</li>
              <li>✅ <strong>Progress tracking</strong> - Monitor upload speed and token usage</li>
              <li>💡 <strong>Tip:</strong> Upload traffic law documents for better AI assistant answers</li>
            </ul>
          </section>

          {/* RAG Documents Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">📄 RAG Documents Tab</h3>
            <p className="text-gray-700 mb-3">Manage AI retrieval documents (for super_admin only)</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>View all documents</strong> - See uploaded RAG documents</li>
              <li>✅ <strong>Check embedding status</strong> - Verify documents are embedded</li>
              <li>✅ <strong>Manage content</strong> - Add, edit, or remove documents</li>
            </ul>
          </section>

          {/* Debug Logs Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">📋 Debug Logs Tab</h3>
            <p className="text-gray-700 mb-3">Monitor system logs and errors</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>View logs</strong> - See info, warning, and error messages</li>
              <li>✅ <strong>Filter by level</strong> - Show only errors or warnings</li>
              <li>✅ <strong>Toggle logging</strong> - Turn off logging when not needed (saves in localStorage)</li>
              <li>✅ <strong>Export logs</strong> - Download logs for analysis</li>
            </ul>
          </section>

          {/* Evaluations Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">🤖 Evaluations Tab</h3>
            <p className="text-gray-700 mb-3">View and test answer grading</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>View test attempts</strong> - See all user answers and verdicts</li>
              <li>✅ <strong>View RAGAS metrics</strong> - Understand grading quality</li>
              <li>✅ <strong>Filter by user</strong> - Find specific user&apos;s attempts</li>
            </ul>
          </section>

          {/* RAGAS Tester Section */}
          <section>
            <h3 className="text-lg font-bold text-indigo-600 mb-3">🧪 RAGAS Tester Tab</h3>
            <p className="text-gray-700 mb-3">Test and validate AI grading quality (super_admin only)</p>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>✅ <strong>Manual testing</strong> - Test specific questions and answers</li>
              <li>✅ <strong>View metrics</strong> - Faithfulness, Relevance, Coherence, etc.</li>
              <li>✅ <strong>Validate RAG</strong> - Ensure documents are being retrieved correctly</li>
            </ul>
          </section>

          {/* Best Practices */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Best Practices</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>🎓 Start by creating courses to organize content</li>
              <li>❓ Then create questions and assign them to courses</li>
              <li>📚 Upload RAG documents for better AI assistance</li>
              <li>🧪 Test grading quality with the RAGAS Tester</li>
              <li>👥 Monitor users and their progress via Evaluations tab</li>
              <li>📋 Keep debug logs for troubleshooting issues</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
