import React from "react";

interface RenderNotesWithCodeProps {
  content: string;
  className?: string;
}

export function RenderNotesWithCode({
  content,
  className = "",
}: RenderNotesWithCodeProps) {
  // Parse content for code blocks
  const parseContent = (text: string) => {
    const parts: (string | { type: "block"; code: string; language: string })[] =
      [];

    // Regex to match [CODE_BLOCK:language]...code...[/CODE_BLOCK]
    const codeBlockRegex = /\[CODE_BLOCK:(.*?)\]\n([\s\S]*?)\n\[\/CODE_BLOCK\]/g;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add the code block
      parts.push({
        type: "block",
        language: match[1],
        code: match[2],
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const parts = parseContent(content);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return (
            <React.Fragment key={index}>
              {part.split("\n").map((line, lineIndex) => (
                <React.Fragment key={`${index}-${lineIndex}`}>
                  {line}
                  {lineIndex < part.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }

        if (part.type === "block") {
          return (
            <pre
              key={index}
              className="bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-700 rounded-lg p-3 sm:p-4 overflow-x-auto my-2 sm:my-3"
            >
              {part.language && part.language !== "other" && (
                <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-2">
                  {part.language.toUpperCase()}
                </div>
              )}
              <code className="font-mono text-xs sm:text-sm text-slate-100 dark:text-slate-50 whitespace-pre-wrap break-words leading-relaxed">
                {part.code}
              </code>
            </pre>
          );
        }

        return null;
      })}
    </div>
  );
}

