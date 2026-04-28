import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  subtitle?: string;
  title?: string;
};

export function BrandLogo({
  href = "/dashboard",
  subtitle = "Lease, harvest, transport, and sales control",
  title = "SRK Coconut ERP"
}: BrandLogoProps) {
  return (
    <Link className="brand-logo" href={href}>
      <span className="brand-logo-mark">
        <Image alt="Business logo" height={76} priority src="/business-logo.png" width={76} />
      </span>
      <span className="brand-logo-copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
    </Link>
  );
}
