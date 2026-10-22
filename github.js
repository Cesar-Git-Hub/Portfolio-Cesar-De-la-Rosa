// Configuración: edita solo este bloque.
const GITHUB_USER = 'Cesar-Git-Hub'; // github.com/Cesar-Git-Hub
const FEATURED = [];      // opcional: nombres exactos de repos, en orden. Vacío = los más recientes (sin forks).
const AUTO_DETECT = false; // false = no adivinar imágenes: usa solo IMAGES (o la tarjeta de GitHub si falta).
const IMAGES = {          // repo (o usuario/repo) -> imagen en la raíz del repo
  'Cesar-Git-Hub/Claim_App_Web': 'ClaimApp.png',
  'Cesar-Git-Hub/ChatApp': 'chatapp.png'
};

(async function () {
  const section = document.getElementById('github');
  if (!section || !GITHUB_USER) return;

  const status = document.getElementById('ghStatus');
  const list = document.getElementById('repos');
  const profile = document.getElementById('ghProfile');
  const max = parseInt(section.dataset.max, 10) || 6;
  const user = encodeURIComponent(GITHUB_USER);

  const enc = encodeURIComponent;
  async function findImage(r) {
    // Acepta la clave como 'repo' o como 'usuario/repo', sin importar mayúsculas.
    const key = Object.keys(IMAGES).find(k => {
      const kk = k.toLowerCase();
      return kk === r.name.toLowerCase() || kk === r.full_name.toLowerCase();
    });
    if (key) return IMAGES[key];
    if (!AUTO_DETECT) return null;
    try {
      const res = await fetch('https://api.github.com/repos/' + user + '/' + enc(r.name) + '/git/trees/' + enc(r.default_branch) + '?recursive=1');
      if (!res.ok) return null;
      const data = await res.json();
      const imgs = (data.tree || []).filter(f => f.type === 'blob' &&
        /\.(png|jpe?g|gif|webp)$/i.test(f.path) &&
        !/node_modules|favicon|logo|icon/i.test(f.path));
      if (!imgs.length) return null;
      const score = p => /screenshot|screen|preview|demo|capture|app/i.test(p) ? 0 : 1;
      imgs.sort((a, b) => score(a.path) - score(b.path));
      return imgs[0].path;
    } catch (e) { return null; }
  }

  section.hidden = false;
  profile.href = 'https://github.com/' + user;

  try {
    const res = await fetch('https://api.github.com/users/' + user + '/repos?per_page=100&sort=pushed');
    if (!res.ok) throw new Error(res.status);
    let repos = (await res.json()).filter(r => !r.fork);
    if (FEATURED.length) repos = FEATURED.map(n => repos.find(r => r.name === n)).filter(Boolean);
    repos = repos.slice(0, max);

    if (!repos.length) { status.textContent = 'No hay repositorios públicos para mostrar todavía.'; return; }
    status.hidden = true;

    repos.forEach(r => {
      const card = document.createElement('article');
      card.className = 'repo';

      // Imagen del repo: tu IMAGES, o una captura detectada dentro del repo, o la tarjeta automática de GitHub.
      const img = document.createElement('img');
      img.alt = 'Vista previa de ' + r.name;
      // Sin loading="lazy": un <img> oculto con lazy nunca se descarga en algunos navegadores.
      img.hidden = true;
      img.onload = () => { img.hidden = false; };
      const cardUrl = 'https://opengraph.githubassets.com/1/' + user + '/' + enc(r.name);
      let usedCard = false;
      img.onerror = () => { if (!usedCard) { usedCard = true; img.src = cardUrl; } else img.remove(); };
      findImage(r).then(path => {
        if (path) img.src = 'https://raw.githubusercontent.com/' + user + '/' + enc(r.name) + '/' + enc(r.default_branch) + '/' + path.split('/').map(enc).join('/');
        else { usedCard = true; img.src = cardUrl; }
      });
      card.appendChild(img);

      const h = document.createElement('h3');
      const a = document.createElement('a');
      a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = r.name;
      h.appendChild(a);

      const p = document.createElement('p');
      p.textContent = r.description || 'Sin descripción todavía.';

      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = [r.language, r.stargazers_count ? '★ ' + r.stargazers_count : ''].filter(Boolean).join('  ');

      card.append(h, p, meta);
      list.appendChild(card);
    });
  } catch (err) {
    status.textContent = 'No pude cargar los repositorios ahora mismo. Puedes verlos directamente en tu perfil de GitHub.';
  }
})();