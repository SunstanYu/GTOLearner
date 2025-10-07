'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleModeClick = (mode: string) => {
    console.log('点击了模式:', mode);
    console.log('准备跳转到:', `/question?mode=${encodeURIComponent(mode)}`);
    router.push(`/question?mode=${encodeURIComponent(mode)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8">GTO Learner</h1>
        <div className="space-y-4">
          <button 
            onClick={() => handleModeClick('综合练习')}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 transition-colors"
          >
            综合练习
          </button>
          <button 
            onClick={() => handleModeClick('价值练习')}
            className="w-full bg-green-500 text-white py-3 px-6 rounded hover:bg-green-600 transition-colors"
          >
            价值练习
          </button>
          <button 
            onClick={() => handleModeClick('Bluff练习')}
            className="w-full bg-red-500 text-white py-3 px-6 rounded hover:bg-red-600 transition-colors"
          >
            Bluff练习
          </button>
        </div>
      </div>
    </div>
  );
}
