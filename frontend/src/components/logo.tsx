import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/">
      <h1 className="text-3xl font-bold text-sky-500">QuickBite</h1>
    </Link>
  );
}
