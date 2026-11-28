import Image from "next/image";
import { coverColors } from "@/lib/books-logic";

type Props = { title: string; author: string; coverUrl?: string | null; seed: string; size?: "sm" | "md" | "lg" };

const SIZES = { sm: "h-48 w-32", md: "h-60 w-40", lg: "h-80 w-52" } as const;
const TITLE = { sm: "text-lg", md: "text-xl", lg: "text-3xl" } as const;
const PX = { sm: [128, 192], md: [160, 240], lg: [208, 320] } as const;

/** A book cover: the real one when known, otherwise a generated typographic cover. */
export function BookCover({ title, author, coverUrl, seed, size = "md" }: Props) {
  const box = `${SIZES[size]} shrink-0 overflow-hidden rounded-xl shadow-lg shadow-black/40`;
  if (coverUrl) {
    return <Image src={coverUrl} alt="" width={PX[size][0]} height={PX[size][1]} className={`${box} object-cover`} />;
  }
  const c = coverColors(seed);
  return (
    <div
      aria-hidden="true"
      className={`${box} relative flex flex-col justify-between p-4`}
      style={{ background: `linear-gradient(155deg, ${c.from}, ${c.to})`, color: "#fff" }}
    >
      <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30" style={{ background: c.accent }} />
      <span className="absolute inset-y-0 left-0 w-2 bg-black/25" />
      <span className={`relative pl-1 font-serif font-bold leading-tight ${TITLE[size]}`}>{title}</span>
      <span className="relative pl-1 text-xs font-semibold uppercase tracking-wider opacity-90">{author}</span>
    </div>
  );
}
