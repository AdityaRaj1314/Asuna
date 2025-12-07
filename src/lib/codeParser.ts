// Extract code blocks from AI responses
export interface CodeBlock {
    language: string;
    filename: string;
    content: string;
}

export function parseCodeBlocks(text: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];

    // Match code blocks with optional filename
    const codeBlockRegex = /```(\w+)(?:\s+(.+?))?\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const language = match[1];
        const filename = match[2]?.trim() || generateFilename(language);
        const content = match[3].trim();

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

export function createHTMLPreview(codeBlocks: CodeBlock[]): string {
    const htmlBlock = codeBlocks.find(b => b.language === 'html');
    const cssBlock = codeBlocks.find(b => b.language === 'css');
    const jsBlock = codeBlocks.find(b => b.language === 'javascript' || b.language === 'js');

    if (!htmlBlock) {
        return '<html><body><h1>No HTML content generated yet</h1></body></html>';
    }

    let html = htmlBlock.content;

    // Inject CSS if present
    if (cssBlock) {
        const styleTag = `<style>${cssBlock.content}</style>`;
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${styleTag}</head>`);
        } else {
            html = `<head>${styleTag}</head>${html}`;
        }
    }

    // Inject JS if present
    if (jsBlock) {
        const scriptTag = `<script>${jsBlock.content}</script>`;
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
