import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export function BackLink() {
  return (
    <Link href="/" className="link link-hover flex items-center gap-1 text-sm mb-6">
      <ArrowLeftIcon className="w-4 h-4" />
      Back
    </Link>
  );
}
