import { useEffect, useState } from "react";

export const Loader = ({
  fullScreen = false,
  text = "",
}: {
  fullScreen?: boolean;
  text?: string;
}) => {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => (dots + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const loaderSvg = (
    <svg viewBox="0 0 300 150" className="w-10 h-10">
      <path
        fill="none"
        stroke="#9E77ED"
        strokeWidth="15"
        strokeLinecap="round"
        strokeDasharray="300 385"
        strokeDashoffset="0"
        d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
      >
        <animate
          attributeName="stroke-dashoffset"
          calcMode="spline"
          dur="2"
          values="685;-685"
          keySplines="0 0 1 1"
          repeatCount="indefinite"
        ></animate>
      </path>
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        {loaderSvg}
        {text && (
          <p className="text-sm text-gray-500">
            {text}
            {dots === 0 ? "" : ".".repeat(dots)}
          </p>
        )}
      </div>
    );
  }

  return loaderSvg;
};
