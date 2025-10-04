"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div>
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
