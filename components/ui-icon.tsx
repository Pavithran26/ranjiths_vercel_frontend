import type { SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "employee"
  | "attendance"
  | "land"
  | "vehicle"
  | "sales"
  | "expense"
  | "reports"
  | "workflow"
  | "logout"
  | "bell"
  | "menu"
  | "delete";

type UiIconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export function UiIcon({ name, className, ...props }: UiIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {name === "dashboard" ? (
        <>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="3.5" width="7" height="5" rx="1.8" />
          <rect x="13.5" y="11.5" width="7" height="9" rx="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
        </>
      ) : null}

      {name === "employee" ? (
        <>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 19c1.8-3.2 4.1-4.8 7-4.8s5.2 1.6 7 4.8" />
        </>
      ) : null}

      {name === "attendance" ? (
        <>
          <path d="M8 4.5h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z" />
          <path d="M9 3v3" />
          <path d="M15 3v3" />
          <path d="M8 10h8" />
          <path d="m10 15 1.6 1.6L15 13.5" />
        </>
      ) : null}

      {name === "land" ? (
        <>
          <path d="M4 18.5c2.7-5.3 6.6-8 11.6-8h4.9" />
          <path d="M5 18.5h14.5" />
          <path d="M12 5.5c2.1.2 3.8 1 5.2 2.3-1.1 2.2-2.8 3.7-5.2 4.5-2.2-.7-3.9-2.2-5.1-4.5 1.3-1.3 3-2.1 5.1-2.3Z" />
        </>
      ) : null}

      {name === "vehicle" ? (
        <>
          <path d="M4 8.5h11l2.5 4H20a1 1 0 0 1 1 1v3H4v-8Z" />
          <path d="m15 8.5 1.8-3h2.7" />
          <circle cx="8" cy="17.5" r="2" />
          <circle cx="17" cy="17.5" r="2" />
        </>
      ) : null}

      {name === "sales" ? (
        <>
          <path d="M4.5 17.5h15" />
          <path d="M7 14V9" />
          <path d="M12 14V6" />
          <path d="M17 14v-3" />
          <path d="m6 6.5 3 2.2 3-3 3 1.8 2.5-2" />
        </>
      ) : null}

      {name === "expense" ? (
        <>
          <path d="M7 4.5h10v15H7Z" />
          <path d="M9.5 8h5" />
          <path d="M9.5 12h5" />
          <path d="M9.5 16h3" />
          <path d="M5 7h2" />
          <path d="M5 11h2" />
        </>
      ) : null}

      {name === "reports" ? (
        <>
          <path d="M12 4.5a7.5 7.5 0 1 0 7.5 7.5H12V4.5Z" />
          <path d="M13.5 4.7a7.3 7.3 0 0 1 5.8 5.8h-5.8V4.7Z" />
        </>
      ) : null}

      {name === "workflow" ? (
        <>
          <path d="M5 7.5h8" />
          <path d="m10 4.5 3 3-3 3" />
          <path d="M19 16.5h-8" />
          <path d="m14 13.5-3 3 3 3" />
        </>
      ) : null}

      {name === "logout" ? (
        <>
          <path d="M10 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4" />
          <path d="M14 8.5 19 12l-5 3.5" />
          <path d="M19 12H9" />
        </>
      ) : null}

      {name === "bell" ? (
        <>
          <path d="M9 19.5a3 3 0 0 0 6 0" />
          <path d="M6 16.5h12l-1.6-2.3V10a4.4 4.4 0 1 0-8.8 0v4.2L6 16.5Z" />
        </>
      ) : null}

      {name === "menu" ? (
        <>
          <path d="M4.5 7h15" />
          <path d="M4.5 12h15" />
          <path d="M4.5 17h15" />
        </>
      ) : null}

      {name === "delete" ? (
        <>
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        </>
      ) : null}
    </svg>
  );
}
