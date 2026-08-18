# Auth Portal

> A simple web UI to authenticate. Made to be used with Caddy forward_auth

## AJAX / API request handling

When a session expires, the `/check` endpoint normally responds with a `302`
redirect to the SSO login flow. This works for page navigations (the browser
follows the redirect), but breaks for `fetch()` / XHR requests because the
browser **silently follows** the redirect chain and ends up receiving the login
page HTML as a successful (200) response.

To handle this, `/check` detects API/fetch requests and returns a **`401` JSON
response** instead of a `302` redirect:

```json
{
  "error": "unauthorized",
  "loginUrl": "https://auth.example.com/sso?redirect=https%3A%2F%2Fapp.example.com"
}
```

### How requests are detected as AJAX

A request is treated as an API request if **any** of the following is true:

| Signal         | Header             | Condition                                              |
| -------------- | ------------------ | ------------------------------------------------------ |
| XHR header     | `X-Requested-With` | `XMLHttpRequest`                                       |
| Accept         | `Accept`           | Contains `application/json`                            |
| Fetch metadata | `Sec-Fetch-Mode`   | Not `navigate` (i.e. `cors`, `no-cors`, `same-origin`) |

### Overriding the behavior with a custom header

The `X-Auth-Portal-Behavior` header lets you force a specific response
**regardless** of the auto-detection above. This is useful for PWAs or SPAs
where you want to guarantee a particular behavior irrespective of how the
request is made. The value is case-insensitive; any value other than `fail` or
`redirect` is ignored.

| Value      | Response                                 |
| ---------- | ---------------------------------------- |
| `fail`     | Return `401` JSON (force API behavior)   |
| `redirect` | Return `302` redirect (force navigation) |

```ts
fetch("/api/data", {
  headers: { "X-Auth-Portal-Behavior": "fail" },
});
```

### Client-side handling

In your app, add a global `fetch` wrapper that detects the `401` and triggers a
full-page navigation (which the browser handles correctly through the normal
`forward_auth` redirect chain):

```ts
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => null);
    if (body?.loginUrl) {
      window.location.href = body.loginUrl;
    }
  }
  return res;
};
```
