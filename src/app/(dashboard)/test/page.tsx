"use client";

export default function TestPage() {
  const testArray = [1, 2, 3];
  const result = testArray.reduce((sum, num) => sum + num, 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>If you can see this, the layout loaded successfully.</p>
      <p>Reduce test result: {result}</p>
    </div>
  );
}
