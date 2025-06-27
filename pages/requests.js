function apiFetch(url, options={}) {
  return fetch(url, options).then(async res => {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('API error', res.status, text);
      throw new Error(text || res.statusText);
    }
    return res.status === 204 ? null : res.json();
  });
}
