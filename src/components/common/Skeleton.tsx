interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  width,
  height,
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`rounded-[12px] bg-surface ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? "20px",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
      }}
      aria-hidden="true"
    />
  );
}
