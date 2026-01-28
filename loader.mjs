export async function resolve(specifier, context, defaultResolve) {
  if (specifier.includes('@')) {
    const parts = specifier.split('@');
    // If it looks like a Pipedream versioned import (e.g., 'alasql@^4')
    // and it's not a scoped package (which would start with @)
    if (parts.length === 2 && !specifier.startsWith('@')) {
      return defaultResolve(parts[0], context, defaultResolve);
    }
    // Handle scoped packages (e.g., '@scope/pkg@^1')
    if (parts.length === 3 && specifier.startsWith('@')) {
      return defaultResolve(`@${parts[1]}`, context, defaultResolve);
    }
  }
  return defaultResolve(specifier, context, defaultResolve);
}
