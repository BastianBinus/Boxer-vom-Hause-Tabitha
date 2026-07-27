export async function loadPartials() {
  const placeholders = document.querySelectorAll('[data-partial]')
  await Promise.all([...placeholders].map(async el => {
    const name = el.dataset.partial
    try {
      const res = await fetch(`partials/${name}.html`)
      if (res.ok) el.innerHTML = await res.text()
    } catch {}
  }))

  // mark active nav link
  const path = location.pathname.split('/').pop() || 'index.html'
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === path) link.classList.add('active')
  })
}
