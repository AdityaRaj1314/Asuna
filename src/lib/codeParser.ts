// Extract code blocks from AI responses
export interface CodeBlock {
    language: string;
    filename: string;
    content: string;
}

export function parseCodeBlocks(text: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];

    // Match code blocks with optional filename
    // Updated regex to be more flexible with spacing and optional filename
    // Match code blocks with optional filename
    // Robust regex to match code blocks
    // Captures:
    // Group 1: Optional language/metadata line (everything after the first ``` until newline)
    // Group 2: Content
    const codeBlockRegex = /```(.*?)\r?\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const metadata = match[1]?.trim() || "";
        const content = match[2].trim();

        // Extract language and filename from metadata
        // Examples: "html index.html", "typescript", "css styles.css", ""
        const parts = metadata.split(/\s+/);
        let language = parts[0] || "plaintext";
        let filename = parts.length > 1 ? parts.slice(1).join(" ") : generateFilename(language);

        // Clean up language if it contains filename like "index.html" being parsed as language
        if (language.includes('.')) {
            filename = language;
            language = filename.split('.').pop() || "plaintext";
        }

        codeBlocks.push({
            language,
            filename,
            content
        });
    }

    return codeBlocks;
}

function generateFilename(language: string): string {
    const extensions: Record<string, string> = {
        html: 'index.html',
        css: 'styles.css',
        javascript: 'script.js',
        js: 'script.js',
        typescript: 'index.ts',
        ts: 'index.ts',
        jsx: 'App.jsx',
        tsx: 'App.tsx',
        json: 'config.json',
    };

    return extensions[language.toLowerCase()] || `file.${language}`;
}

export function cleanText(text: string): string {
    // Remove code blocks and replace with a subtle placeholder
    const codeBlockRegex = /```[\s\S]*?```/g;
    return text.replace(codeBlockRegex, '').trim();
}

export function createHTMLPreview(codeBlocks: CodeBlock[]): string {
    const htmlBlock = codeBlocks.find(b => b.language === 'html');
    const cssBlocks = codeBlocks.filter(b => b.language === 'css');
    const jsBlocks = codeBlocks.filter(b => b.language === 'javascript' || b.language === 'js');

    if (!htmlBlock) {
        return '<html><body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #666;"><h1>No HTML content generated yet</h1></body></html>';
    }

    let html = htmlBlock.content;

    // Inject CSS if present
    if (cssBlocks.length > 0) {
        const cssContent = cssBlocks.map(b => b.content).join('\n');
        const styleTag = `<style>${cssContent}</style>`;
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${styleTag}</head>`);
        } else if (html.includes('<html>')) {
            html = html.replace('<html>', `<html><head>${styleTag}</head>`);
        } else {
            html = `<head>${styleTag}</head>${html}`;
        }
    }

    // Inject JS if present
    if (jsBlocks.length > 0) {
        const jsContent = jsBlocks.map(b => b.content).join('\n');
        const scriptTag = `<script>${jsContent}</script>`;
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptTag}</body>`);
        } else {
            html = `${html}${scriptTag}`;
        }
    }

    // Wrap if not a complete HTML document
    if (!html.includes('<html')) {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
    ${html}
</body>
</html>`;
    }

    return html;
}
