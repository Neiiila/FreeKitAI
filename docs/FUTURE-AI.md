# Adding a real AI feature later (safely)

The current tools are template engines and say so on every page. If you add AI later, keep these rules:

1. **Never put an API key in front-end code.** Everything in `src/assets/` is public. Call the model from a backend (for example a Cloudflare Pages Function) that reads the key from an encrypted environment variable.
2. **Label it honestly.** Only call output "AI-generated" when it is. Keep the template version as a free fallback.
3. **Update the privacy policy first.** With AI, user text *does* leave the browser and goes to your backend and the model provider. The current policy says the opposite, so it must change before launch.
4. **Protect your budget.** Add rate limiting (e.g. Cloudflare Turnstile + per-IP limits), a maximum input length, and a spending cap with the provider.
5. **Keep the "no invented facts" rule** in your system prompt, and keep the `[placeholder]` approach for numbers and results.

## How the code is prepared

Each tool's logic is a pure function in `src/assets/js/engines/` (for example `generateEmail(input, variant)`) that returns plain data. The UI scripts in `src/assets/js/tools/` only call that function and render the result. An AI version can return the same shape:

```js
// src/assets/js/engines/email-ai.js   (future)
export async function generateEmailAI(input) {
  const res = await fetch('/api/email', {            // same-origin: CSP connect-src 'self' already allows it
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('AI unavailable');
  return res.json();                                   // { subject, body, notes }
}
```

Then, in the UI script, try the AI version and fall back to the template engine on error.

## Example backend (Cloudflare Pages Function), not deployed

Pages deploys anything inside a top-level `functions/` folder, so this example is kept in docs. To use it, move it to `functions/api/email.js` and set the secret with `npx wrangler pages secret put AI_API_KEY`.

```js
// functions/api/email.js
export async function onRequestPost({ request, env }) {
  const input = await request.json();
  const text = JSON.stringify(input);
  if (text.length > 4000) return new Response('Too long', { status: 413 });

  // Call your chosen model provider here with env.AI_API_KEY (never sent to the browser).
  // Instruct the model to use only the facts provided and to leave [placeholders] for anything unknown.
  const result = { subject: '...', body: '...', notes: [] };

  return Response.json(result);
}
```

Remove the `no network calls` test in `tests/run.mjs` only for the specific AI file, and keep it for the rest.
