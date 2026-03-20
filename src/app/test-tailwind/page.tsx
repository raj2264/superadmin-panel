export default function TestTailwindPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600 dark:text-blue-400">
        Tailwind CSS Test Page
      </h1>
      
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Primary Card
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This card is styled with Tailwind classes. If you see it properly styled,
            Tailwind is working correctly.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Button
          </button>
        </div>
        
        {/* Card 2 */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md p-6 border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-300">
            Success Card
          </h2>
          <p className="text-green-700 dark:text-green-400">
            This is another card with different styling to test color variants.
          </p>
          <div className="mt-4 flex space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Tag 1
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              Tag 2
            </span>
          </div>
        </div>
        
        {/* Card 3 */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-300">
            Danger Card
          </h2>
          <p className="text-red-700 dark:text-red-400">
            This card tests red color variants in Tailwind.
          </p>
          <button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
            Delete
          </button>
        </div>
        
        {/* Card 4 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-md p-6 border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-xl font-semibold mb-2 text-yellow-800 dark:text-yellow-300">
            Warning Card
          </h2>
          <p className="text-yellow-700 dark:text-yellow-400">
            This card tests yellow color variants in Tailwind.
          </p>
          <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
            <div className="h-full w-2/3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Testing flex and responsive layouts */}
      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Flex & Responsive Tests
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex-1 p-4 bg-blue-100 dark:bg-blue-900/30 rounded">
            <p className="text-blue-800 dark:text-blue-300">Flex Item 1</p>
          </div>
          <div className="flex-1 p-4 bg-purple-100 dark:bg-purple-900/30 rounded">
            <p className="text-purple-800 dark:text-purple-300">Flex Item 2</p>
          </div>
          <div className="flex-1 p-4 bg-pink-100 dark:bg-pink-900/30 rounded">
            <p className="text-pink-800 dark:text-pink-300">Flex Item 3</p>
          </div>
        </div>
      </div>
    </div>
  );
} 