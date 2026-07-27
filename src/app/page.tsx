export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          Traffic Laws Q&A
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Study Israeli traffic laws for your driving exam
        </p>
        <div className="text-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Login with Gmail
          </button>
        </div>
      </div>
    </main>
  );
}
