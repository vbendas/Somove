export function WaveDivider({
  color = "#FFF5E1",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${className}`}
      style={{ transform: flip ? "rotate(180deg)" : "none" }}
    >
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export function WaveDivider2({
  color = "#FFF5E1",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${className}`}
      style={{ transform: flip ? "rotate(180deg)" : "none" }}
    >
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 60C180 20 360 70 540 40C720 10 900 60 1080 40C1260 20 1350 50 1440 30V80H0V60Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export function WaveDivider3({
  color = "#FFF5E1",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${className}`}
      style={{ transform: flip ? "rotate(180deg)" : "none" }}
    >
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 30C360 80 720 0 1080 50C1260 70 1380 30 1440 40V80H0V30Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export function WaveDividerTilt({
  color = "#FFF5E1",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${className}`}
      style={{ transform: flip ? "rotate(180deg)" : "none" }}
    >
      <svg
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path d="M0 60L1440 0V60H0Z" fill={color} />
      </svg>
    </div>
  );
}
