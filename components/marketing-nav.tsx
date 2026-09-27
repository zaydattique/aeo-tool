import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          AEO Command
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/product" className="hover:text-foreground">
            Product
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/aeo" className="hover:text-foreground">
            What is AEO?
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-semibold">AEO Command</p>
          <p className="text-muted-foreground mt-2">
            Answer Engine Optimization platform for agencies. By{" "}
            <a href="https://threezero.agency" className="underline">
              Threezero Agency
            </a>
            .
          </p>
        </div>
        <div>
          <p className="font-medium mb-2">Product</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link href="/product" className="hover:underline">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:underline">
                Free trial
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Learn</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link href="/aeo" className="hover:underline">
                What is Answer Engine Optimization?
              </Link>
            </li>
            <li>
              <Link href="/llms.txt" className="hover:underline">
                llms.txt
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Threezero Agency. AEO Command.
      </div>
    </footer>
  );
}
