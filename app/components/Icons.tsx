type IconProps = { size?: number; strokeWidth?: number };

function Svg({ children, size = 22, strokeWidth = 1.8 }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (props: IconProps) => (
  <Svg {...props}><path d="M12 5v14M5 12h14" /></Svg>
);
export const ChevronLeftIcon = (props: IconProps) => (
  <Svg {...props}><path d="m15 18-6-6 6-6" /></Svg>
);
export const ChevronRightIcon = (props: IconProps) => (
  <Svg {...props}><path d="m9 18 6-6-6-6" /></Svg>
);
export const JournalIcon = (props: IconProps) => (
  <Svg {...props}><path d="M6 3h11a2 2 0 0 1 2 2v16H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" /><path d="M6 3v18M9 8h6M9 12h6" /></Svg>
);
export const ChartIcon = (props: IconProps) => (
  <Svg {...props}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /></Svg>
);
export const SettingsIcon = (props: IconProps) => (
  <Svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" /></Svg>
);
export const ShareIcon = (props: IconProps) => (
  <Svg {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></Svg>
);
export const EditIcon = (props: IconProps) => (
  <Svg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></Svg>
);
export const TrashIcon = (props: IconProps) => (
  <Svg {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></Svg>
);
export const DownloadIcon = (props: IconProps) => (
  <Svg {...props}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Svg>
);
export const UploadIcon = (props: IconProps) => (
  <Svg {...props}><path d="M12 15V3M7 8l5-5 5 5M5 21h14" /></Svg>
);
export const SparkleIcon = (props: IconProps) => (
  <Svg {...props}><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8Z" /><path d="m19 15 .6 1.9L21 18l-1.4 1.1L19 21l-.6-1.9L17 18l1.4-1.1Z" /></Svg>
);
export const EyeIcon = (props: IconProps) => (
  <Svg {...props}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></Svg>
);
export const EyeOffIcon = (props: IconProps) => (
  <Svg {...props}><path d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.7M6.6 6.6C4 8.3 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 4-.8M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Svg>
);
