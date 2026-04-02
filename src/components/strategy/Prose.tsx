import Markdown from "react-markdown";

interface ProseProps {
  children: string;
  className?: string;
}

export function Prose({ children, className = "" }: ProseProps) {
  return (
    <div
      className={`prose-custom text-sm leading-relaxed text-muted-foreground ${className}`}
    >
      <Markdown
        components={{
          h1: ({ children }) => (
            <h3 className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-sm font-bold text-foreground mt-3 mb-1.5 first:mt-0">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-sm font-semibold text-foreground mt-2 mb-1 first:mt-0">
              {children}
            </h5>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="ml-4 mb-2 space-y-1 list-none">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 mb-2 space-y-1 list-decimal marker:text-primary/60">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/40">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 my-2 italic text-stone">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
