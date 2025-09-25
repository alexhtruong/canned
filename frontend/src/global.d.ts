declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.sass' {
  const content: Record<string, string>;
  export default content;
}

// Allow side-effect CSS imports (for import './globals.css' syntax)
declare module '*.css';
declare module '*.scss';
declare module '*.sass';