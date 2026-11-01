import type { Page } from '@playwright/test'

// hCaptcha's documented test response token. The sandboxed server accepts it for the contact and
// free resource forms (src/server/sandbox.ts); Supabase Auth would still verify it itself.
export const HCAPTCHA_TEST_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001'

// A browser-only stand-in for https://js.hcaptcha.com/1/api.js, served by page.route in tests, so
// the suite never depends on hCaptcha's network. It implements the slice of the API that
// @hcaptcha/react-hcaptcha calls (render, execute, reset, remove, getResponse, getRespKey, setData,
// close) and calls the loader's onload callback named in its own script URL. A checkbox widget
// renders a button labelled "hCaptcha test checkbox"; clicking it verifies. Invisible widgets
// resolve execute() with the test token at once.
const STUB = `(() => {
  const TOKEN = ${JSON.stringify(HCAPTCHA_TEST_TOKEN)};
  const widgets = new Map();
  let next = 1;
  const verify = (id) => {
    const w = widgets.get(id);
    if (!w) return;
    w.response = TOKEN;
    if (w.button) w.button.setAttribute('aria-checked', 'true');
    if (typeof w.params.callback === 'function') w.params.callback(TOKEN);
  };
  window.hcaptcha = {
    render(container, params) {
      const id = 'stub-' + next++;
      const w = { params: params || {}, response: '', button: null };
      widgets.set(id, w);
      if ((params && params.size) !== 'invisible' && container) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'checkbox');
        button.setAttribute('aria-checked', 'false');
        button.setAttribute('data-testid', 'hcaptcha-stub');
        button.textContent = 'hCaptcha test checkbox';
        button.addEventListener('click', () => verify(id));
        container.appendChild(button);
        w.button = button;
      }
      return id;
    },
    execute(id, opts) {
      const key = id || [...widgets.keys()].pop();
      verify(key);
      if (opts && opts.async) return Promise.resolve({ response: TOKEN, key: 'stub' });
    },
    reset(id) {
      const w = widgets.get(id);
      if (!w) return;
      w.response = '';
      if (w.button) w.button.setAttribute('aria-checked', 'false');
    },
    remove(id) {
      const w = widgets.get(id);
      if (w && w.button) w.button.remove();
      widgets.delete(id);
    },
    getResponse(id) { return (widgets.get(id) || {}).response || ''; },
    getRespKey() { return 'stub'; },
    setData() {},
    close() {},
  };
  const src = (document.currentScript && document.currentScript.src) || '';
  const onload = new URL(src, location.href).searchParams.get('onload');
  if (onload && typeof window[onload] === 'function') setTimeout(() => window[onload](), 0);
})();`

export async function stubHCaptcha(page: Page) {
  await page.route(/^https:\/\/([a-z0-9-]+\.)*hcaptcha\.com\//, (route) => {
    const url = route.request().url()
    if (/\/1\/(secure-)?api\.js/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: STUB })
    }
    return route.abort()
  })
}
