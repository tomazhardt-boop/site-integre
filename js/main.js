/* ============================================================
   INTEGRE JR. · main.js (protótipo)
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Header: sombra ao rolar ---------- */
  const header = $('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  const drawer = $('.mobile-nav');
  const openBtn = $('#openMenu');
  const closeBtn = $('#closeMenu');
  const setDrawer = (open) => {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && closeBtn) closeBtn.focus();
  };
  if (openBtn) openBtn.addEventListener('click', () => setDrawer(true));
  if (closeBtn) closeBtn.addEventListener('click', () => { setDrawer(false); if (openBtn) openBtn.focus(); });
  if (drawer) {
    const scrim = $('.mobile-nav__scrim', drawer);
    if (scrim) scrim.addEventListener('click', () => setDrawer(false));
    $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) {
      setDrawer(false);
      if (openBtn) openBtn.focus();
    }
  });

  /* ---------- Entrada ao rolar (.reveal) ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Formulário de demonstração: valida e mostra o sucesso, não envia nada ---------- */
  $$('form[data-mock]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let firstInvalid = null;
      $$('[required]', form).forEach(field => {
        const valid = field.checkValidity();
        const campo = field.closest('.campo');
        if (campo) campo.classList.toggle('is-invalid', !valid);
        if (!valid && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      const sucesso = form.parentElement.querySelector('.form-sucesso');
      form.hidden = true;
      if (sucesso) { sucesso.hidden = false; sucesso.focus(); }
    });
    $$('[required]', form).forEach(field => field.addEventListener('input', () => {
      const campo = field.closest('.campo');
      if (campo && field.checkValidity()) campo.classList.remove('is-invalid');
    }));
  });

  /* ---------- Usados pelos efeitos de texto abaixo ---------- */
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Separa o texto em letras sem quebrar acentos compostos (Intl.Segmenter, quando houver).
  const letras = (texto) => ('Segmenter' in Intl)
    ? Array.from(new Intl.Segmenter('pt', { granularity: 'grapheme' }).segment(texto), s => s.segment)
    : Array.from(texto);

  /* ---------- Título que se embaralha ao abrir a página ([data-embaralhar]) ----------
     Versão sem React do TextScramble (21st.dev): as letras viram caracteres sorteados e vão se
     acertando da esquerda para a direita. Como a Poppins não é monoespaçada, cada letra ganha uma
     caixa com a largura da letra final, para o título não tremer nem mudar de linha. Os <span> de
     dentro (como o .contorno) ficam, então as letras sorteadas herdam o estilo. No fim, volta o HTML
     original. */
  const SORTEIO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const DURACAO = 800, PASSO = 40;   // ms, como o duration 0.8 / speed 0.04 do original
  if (!semMovimento && document.fonts) {
    $$('[data-embaralhar]').forEach(el => {
      const original = el.innerHTML;
      document.fonts.ready.then(() => {   // medir antes da Poppins carregar daria larguras erradas
        el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
        const textos = [];
        const andar = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (andar.nextNode()) textos.push(andar.currentNode);
        const caixas = [];
        textos.forEach(no => {
          const trecho = document.createDocumentFragment();
          no.textContent.split(/(\s+)/).forEach(parte => {
            if (!parte) return;
            if (!parte.trim()) { trecho.append(' '); return; }
            const palavra = document.createElement('span');
            palavra.className = 'embaralha__palavra';
            letras(parte).forEach(ch => {
              const caixa = document.createElement('span');
              caixa.className = 'embaralha__letra';
              caixa.textContent = ch;
              palavra.append(caixa);
              caixas.push(caixa);
            });
            trecho.append(palavra);
          });
          no.replaceWith(trecho);
        });
        const finais = caixas.map(c => c.textContent);
        const larguras = caixas.map(c => c.getBoundingClientRect().width);
        caixas.forEach((c, i) => { c.style.width = larguras[i] + 'px'; });
        const total = DURACAO / PASSO;
        let passo = 0;
        const quadro = () => {
          const acertadas = (passo / total) * caixas.length;
          caixas.forEach((c, i) => {
            c.textContent = i < acertadas ? finais[i] : SORTEIO[Math.floor(Math.random() * SORTEIO.length)];
          });
          if (++passo > total) {
            clearInterval(timer);
            el.innerHTML = original;
            el.removeAttribute('aria-label');
          }
        };
        const timer = setInterval(quadro, PASSO);
        quadro();
      });
    });
  }

  /* ---------- Vitrine das soluções: o nome gira letra a letra conforme o item no meio da tela ----------
     Versão sem React do TextRotate (21st.dev): as letras do nome atual saem para cima, uma depois
     da outra, e só então as do novo nome entram por baixo (o modo "wait" do original). */
  const vitrine = $('.vitrine');
  if (vitrine && 'IntersectionObserver' in window) {
    const ATRASO = 12;   // ms entre uma letra e a próxima (o transition-delay do CSS)
    const SAIDA = 350;   // ms da letra saindo (o transition-duration de .is-saindo)

    // Palavras antes da última ficam de contorno, como no .titulo ("CARACTERIZAÇÃO DE" + "MATERIAIS").
    const montar = (texto, contornar) => {
      const linha = document.createElement('span');
      linha.className = 'giro__linha is-entrando';
      const palavras = texto.split(' ');
      let n = 0;
      palavras.forEach((p, i) => {
        const palavra = document.createElement('span');
        palavra.className = 'giro__palavra' + (contornar && i < palavras.length - 1 ? ' contorno' : '');
        letras(p).forEach(ch => {
          const letra = document.createElement('span');
          letra.className = 'giro__letra';
          letra.style.setProperty('--i', n++);
          letra.textContent = ch;
          palavra.append(letra);
        });
        linha.append(palavra);
      });
      return linha;
    };

    // Devolve uma função que leva o elemento ao texto pedido. Se pedirem outro texto durante a
    // saída, entra direto o último pedido (rolar rápido não enfileira os do meio).
    const criarGiro = (el, contornar) => {
      let alvo = el.textContent.trim(), mostrado = alvo, saindo = false;
      el.replaceChildren(montar(alvo, contornar));
      el.firstChild.classList.remove('is-entrando');
      const trocar = () => {
        if (saindo || alvo === mostrado) return;
        const velha = el.firstChild;
        saindo = true;
        velha.classList.add('is-saindo');
        setTimeout(() => {
          const nova = montar(alvo, contornar);
          el.replaceChildren(nova);
          mostrado = alvo;
          nova.getBoundingClientRect();   // aplica a posição inicial antes de animar
          nova.classList.remove('is-entrando');
          saindo = false;
          trocar();
        }, semMovimento ? 0 : SAIDA + ATRASO * (velha.querySelectorAll('.giro__letra').length - 1));
      };
      return (texto) => { alvo = texto; trocar(); };
    };

    const itens = $$('.vitrine__item', vitrine);
    const girarNome = criarGiro($('[data-giro="nome"]', vitrine), true);
    const girarNumero = criarGiro($('[data-giro="numero"]', vitrine), false);
    const barra = $('.vitrine__barra', vitrine);
    const marcas = itens.map(() => document.createElement('i'));
    barra.replaceChildren(...marcas);
    const ir = (i) => {
      girarNome($('.vitrine__nome', itens[i]).textContent);
      girarNumero(String(i + 1).padStart(2, '0'));
      marcas.forEach((m, j) => m.classList.toggle('is-feito', j <= i));
    };
    ir(0);
    // Troca quando a imagem do item entra na faixa de 10% no meio da tela, como o useInView do
    // demo (margin "-45% 0px -45% 0px"). No espaço entre as soluções, o nome anterior fica.
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) ir(itens.indexOf(en.target.closest('.vitrine__item'))); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    itens.forEach(it => io.observe($('.bloco__midia', it)));
  }

  /* ---------- Grade que acende em volta do cursor (canvas[data-grade-cursor], caixa do Desenvolvimento
     Web em Soluções) ----------
     Versão sem React do CursorGrid (React Bits, variante JS-CSS), com hexágonos no lugar dos quadrados.
     O canvas fica atrás do conteúdo e não recebe o mouse, então o movimento é ouvido no elemento pai
     inteiro (acende até sobre o texto). A cor vem do color do .grade-cursor no CSS, para seguir os
     tokens do :root. GRADE é o padrão; cada canvas pode trocar valores num JSON em data-grade-cursor. */
  const GRADE = {
    cellSize: 70,        // largura de cada hexágono, de um lado reto ao outro (px)
    radius: 140,         // raio em volta do cursor que acende (px)
    falloff: 'smooth',   // como o brilho cai com a distância: linear, smooth ou sharp
    holdTime: 400,       // ms que a célula fica acesa antes de começar a apagar
    fadeDuration: 800,   // ms para apagar
    lineWidth: 1.2,
    maxOpacity: 1,
    fillOpacity: 0,      // preenchimento da célula acesa (0 = só o contorno)
    gridOpacity: 0,      // colmeia fixa de fundo (0 = invisível)
    clickPulse: true,    // clique/toque solta um anel que acende as células por onde passa
    pulseSpeed: 600      // px por segundo do anel
  };
  const CURVAS = { linear: t => t, smooth: t => t * t * (3 - 2 * t), sharp: t => t * t * t };
  $$('canvas[data-grade-cursor]').forEach(canvas => {
    if (semMovimento || !('ResizeObserver' in window)) return;
    const p = Object.assign({}, GRADE, JSON.parse(canvas.dataset.gradeCursor || '{}'));
    const area = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [cr, cg, cb] = getComputedStyle(canvas).color.match(/\d+/g).map(Number);
    const ease = CURVAS[p.falloff] || CURVAS.linear;
    // Colmeia de hexágonos com a ponta para cima, como o hexágono da marca (icone-hexagono.png):
    // cada linha desce 3/4 da altura do hexágono, e as linhas ímpares andam meia célula para o lado.
    const hexR = p.cellSize / Math.sqrt(3);   // do centro até uma ponta
    const rowH = hexR * 1.5;
    const CANTOS = [0, 1, 2, 3, 4, 5].map(k => [Math.cos(Math.PI / 3 * k - Math.PI / 2), Math.sin(Math.PI / 3 * k - Math.PI / 2)]);
    const hexPath = (cx, cy, r) => {
      CANTOS.forEach(([dx, dy], k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + r * dx, cy + r * dy));
      ctx.closePath();
    };

    // Estado da grade: um brilho e a hora do último toque por célula, linha a linha.
    let cols = 0, rows = 0, offX = 0, offY = 0, w = 0, h = 0;
    let alphas = new Float32Array(0), touched = new Float64Array(0);
    const pulses = [];
    let running = false, lastFrame = 0;

    const rebuild = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / p.cellSize) + 1;
      rows = Math.ceil(h / rowH) + 2;
      // Centraliza: as células da borda cortam igual dos dois lados.
      offX = (w - (cols + 0.5) * p.cellSize) / 2;
      offY = (h - ((rows - 1) * rowH + 2 * hexR)) / 2;
      alphas = new Float32Array(cols * rows);
      touched = new Float64Array(cols * rows);
    };

    const cellCenter = i => {
      const row = Math.floor(i / cols);
      return [offX + (i % cols + (row % 2 ? 1 : 0.5)) * p.cellSize, offY + row * rowH + hexR];
    };

    // Células que podem ter o centro no quadrado (x ± r, y ± r); quem chama confere a distância.
    const cellsAround = (x, y, r, fn) => {
      const minCol = Math.max(0, Math.floor((x - r - offX) / p.cellSize) - 1);
      const maxCol = Math.min(cols - 1, Math.floor((x + r - offX) / p.cellSize));
      const minRow = Math.max(0, Math.floor((y - r - offY - hexR) / rowH));
      const maxRow = Math.min(rows - 1, Math.ceil((y + r - offY - hexR) / rowH));
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) fn(row * cols + col);
      }
    };

    // Acende as células cujo centro cai dentro do raio; a curva converte distância em brilho.
    const energize = (x, y) => {
      const r = Math.max(p.radius, 1);
      const now = performance.now();
      cellsAround(x, y, r, i => {
        const [cx, cy] = cellCenter(i);
        const dist = Math.hypot(cx - x, cy - y);
        if (dist > r) return;
        const level = ease(1 - dist / r) * p.maxOpacity;
        if (level > alphas[i]) alphas[i] = level;
        if (level > 0) touched[i] = now;
      });
    };

    const draw = now => {
      const dt = Math.min(now - lastFrame, 50);
      lastFrame = now;
      ctx.clearRect(0, 0, w, h);

      if (p.gridOpacity > 0) {
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${p.gridOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < alphas.length; i++) hexPath(...cellCenter(i), hexR);
        ctx.stroke();
      }

      // O anel de cada clique passa o brilho para as células que cruza.
      for (let pi = pulses.length - 1; pi >= 0; pi--) {
        const pulse = pulses[pi];
        const ringR = (now - pulse.t0) / 1000 * p.pulseSpeed;
        if (ringR > Math.hypot(w, h)) { pulses.splice(pi, 1); continue; }
        const band = p.cellSize;
        cellsAround(pulse.x, pulse.y, ringR + band, i => {
          const [cx, cy] = cellCenter(i);
          const dist = Math.hypot(cx - pulse.x, cy - pulse.y);
          if (Math.abs(dist - ringR) < band / 2 && p.maxOpacity > alphas[i]) {
            alphas[i] = p.maxOpacity;
            touched[i] = now;
          }
        });
      }

      let anyVisible = pulses.length > 0;
      const fadeStep = dt / Math.max(p.fadeDuration, 16);
      const half = p.cellSize / 2;
      for (let i = 0; i < alphas.length; i++) {
        let a = alphas[i];
        if (a <= 0) continue;
        if (now - touched[i] > p.holdTime) {
          a = alphas[i] = Math.max(0, a - fadeStep);
          if (a <= 0) continue;
        }
        anyVisible = true;
        const [cx, cy] = cellCenter(i);
        const gradient = ctx.createRadialGradient(cx, cy, half * 0.1, cx, cy, p.cellSize);
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a})`);
        gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.beginPath();
        hexPath(cx, cy, hexR - 0.6);   // meio pixel de folga entre vizinhos, como os quadrados do original
        if (p.fillOpacity > 0) {
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * p.fillOpacity})`;
          ctx.fill();
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.lineWidth;
        ctx.stroke();
      }

      // Só segue desenhando enquanto houver célula acesa ou anel andando.
      if (anyVisible) requestAnimationFrame(draw);
      else running = false;
    };

    const wake = () => {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(draw);
    };

    const toLocal = e => {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };
    area.addEventListener('pointermove', e => { energize(...toLocal(e)); wake(); });
    if (p.clickPulse) {
      area.addEventListener('pointerdown', e => {
        const [x, y] = toLocal(e);
        pulses.push({ x, y, t0: performance.now() });
        wake();
      });
    }
    new ResizeObserver(() => { rebuild(); wake(); }).observe(canvas);   // também roda uma vez ao começar
  });

  /* ---------- Partículas que seguem o mouse (canvas[data-particulas], faixa do Integre Talks) ----------
     Versão sem React do Particles (Magic UI): pontinhos que surgem aos poucos, derivam devagar e se
     deslocam um pouco na direção do mouse, cada um com um "magnetismo" diferente (dá profundidade).
     Somem perto das bordas e renascem em outro lugar ao sair. A cor é o color do .particulas no CSS.
     Além dos soltos, há focos em grade (a identidade do Integre Talks): círculos de pontos alinhados,
     sem falhas, que vão perdendo o brilho do centro para a borda; cada foco segue o mouse inteiro,
     como uma camada. Só anima enquanto a faixa está na tela; sem movimento, os pontos ficam parados. */
  const PARTICULAS = {
    quantity: 100,   // quantos pontos soltos
    staticity: 50,   // quanto maior, menos eles seguem o mouse
    ease: 50,        // quanto maior, mais devagar chegam à posição nova
    size: 0.4,       // raio do ponto solto menor (px); metade dos pontos ganha 1 px a mais
    vx: 0,           // deriva constante na horizontal e na vertical (px por quadro)
    vy: 0,
    focos: [         // centro em fração da faixa (0 a 1) e raio em px (no celular, no máximo 30% da largura);
      { x: 0.08, y: 0.3, raio: 140 },    // o centro é empurrado para dentro para o círculo nunca sair cortado;
      { x: 0.94, y: 0.1, raio: 80 },     // posições pensadas para a faixa com o carrossel, longe do texto e das fotos
      { x: 0.92, y: 0.5, raio: 110 }
    ],
    focosCelular: [  // até 960 px tudo fica empilhado: entre o título da capa e o carrossel, longe do texto
      { x: 0.14, y: 0.67, raio: 55 },
      { x: 0.86, y: 0.65, raio: 48 }
    ],
    focoPasso: 13,    // distância entre os pontos da grade (px)
    focoTamanho: 1.3,  // raio dos pontos dos focos (px)
    focoBrilho: 0.75   // brilho dos pontos no centro do foco (cai até zero na borda)
  };
  $$('canvas[data-particulas]').forEach(canvas => {
    const p = PARTICULAS;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [cr, cg, cb] = getComputedStyle(canvas).color.match(/\d+/g).map(Number);
    const mouse = { x: 0, y: 0 };   // em relação ao centro do canvas
    let w = 0, h = 0, circles = [], raf = 0, visivel = false;

    const novo = () => ({
      x: Math.floor(Math.random() * w),
      y: Math.floor(Math.random() * h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + p.size,
      alpha: 0,
      targetAlpha: Math.round((Math.random() * 0.6 + 0.1) * 10) / 10,
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4
    });

    // Pontos de um foco: grade completa dentro do círculo, e o brilho cai em linha reta do centro
    // (focoBrilho) até a borda (zero). Não derivam, e o foco inteiro usa o mesmo magnetismo para a
    // grade não se deformar quando segue o mouse.
    const foco = f => {
      const raio = Math.min(f.raio, w * 0.3);
      const fx = Math.min(Math.max(f.x * w, raio), w - raio), fy = Math.min(Math.max(f.y * h, raio), h - raio);
      const magnetism = 1 + Math.random() * 2;
      const pontos = [];
      for (let gy = -raio; gy <= raio; gy += p.focoPasso) {
        for (let gx = -raio; gx <= raio; gx += p.focoPasso) {
          const t = Math.hypot(gx, gy) / raio;
          const x = fx + gx, y = fy + gy;
          if (t > 1 || x < 0 || x > w || y < 0 || y > h) continue;
          pontos.push({ x, y, translateX: 0, translateY: 0, size: p.focoTamanho, alpha: 0,
                        targetAlpha: p.focoBrilho * (1 - t), dx: 0, dy: 0, magnetism });
        }
      }
      return pontos;
    };

    const desenhar = c => {
      ctx.beginPath();
      ctx.arc(c.x + c.translateX, c.y + c.translateY, c.size, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${c.alpha})`;
      ctx.fill();
    };

    const iniciar = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const focos = window.matchMedia('(max-width: 960px)').matches ? p.focosCelular : p.focos;
      circles = Array.from({ length: p.quantity }, novo).concat(...focos.map(foco));
      if (semMovimento) circles.forEach(c => { c.alpha = c.targetAlpha; desenhar(c); });
    };

    const quadro = () => {
      ctx.clearRect(0, 0, w, h);
      circles.forEach((c, i) => {
        // Perto da borda (menos de 20 px) o ponto apaga; longe dela, acende aos poucos até o próprio brilho
        const borda = Math.min(c.x + c.translateX, w - c.x - c.translateX, c.y + c.translateY, h - c.y - c.translateY) - c.size;
        const fator = Math.max(0, borda / 20);
        c.alpha = fator > 1 ? Math.min(c.alpha + 0.02, c.targetAlpha) : c.targetAlpha * fator;
        c.x += c.dx + p.vx;
        c.y += c.dy + p.vy;
        c.translateX += (mouse.x / (p.staticity / c.magnetism) - c.translateX) / p.ease;
        c.translateY += (mouse.y / (p.staticity / c.magnetism) - c.translateY) / p.ease;
        desenhar(c);
        if (c.x < -c.size || c.x > w + c.size || c.y < -c.size || c.y > h + c.size) circles[i] = novo();   // saiu: nasce outro
      });
      raf = visivel ? requestAnimationFrame(quadro) : 0;
    };

    new ResizeObserver(iniciar).observe(canvas);   // também roda uma vez ao começar
    if (semMovimento) return;
    window.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - w / 2, y = e.clientY - rect.top - h / 2;
      if (Math.abs(x) < w / 2 && Math.abs(y) < h / 2) { mouse.x = x; mouse.y = y; }   // só vale com o mouse dentro
    }, { passive: true });
    new IntersectionObserver(([en]) => {
      visivel = en.isIntersecting;
      if (visivel && !raf) raf = requestAnimationFrame(quadro);
    }).observe(canvas);
  });

  /* ---------- Carrossel de fotos ([data-carrossel], Integre Talks em Eventos) ----------
     Uma foto por vez; a anterior e a próxima aparecem em parte nas laterais, desfocadas (o visual é
     todo do CSS). Cada slide recebe --pos = distância até a foto atual contando em círculo (com 6
     fotos: -3 a 2), então o carrossel não tem fim. Navega clicando na foto vizinha, nos traços de
     baixo, arrastando para o lado no celular ou com as setas do teclado. */
  $$('[data-carrossel]').forEach(carrossel => {
    const slides = $$('.carrossel__slide', carrossel);
    const palco = $('.carrossel__palco', carrossel);
    const n = slides.length, meio = Math.floor(n / 2);
    let atual = 0, x0 = null, arrastou = false;
    const tracos = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Foto ${i + 1} de ${n}`);
      b.addEventListener('click', () => ir(i));
      return b;
    });
    $('.carrossel__pontos', carrossel).append(...tracos);

    const ir = i => {
      atual = (i + n) % n;
      slides.forEach((s, j) => {
        const pos = ((j - atual + n + meio) % n) - meio;
        s.style.setProperty('--pos', pos);
        s.classList.toggle('is-ativo', pos === 0);
        s.classList.toggle('is-vizinho', Math.abs(pos) === 1);
        s.setAttribute('aria-hidden', String(pos !== 0));
      });
      tracos.forEach((b, j) => b.setAttribute('aria-current', String(j === atual)));
    };
    ir(0);

    slides.forEach(s => s.addEventListener('click', () => {
      const pos = Number(s.style.getPropertyValue('--pos'));
      if (!arrastou && Math.abs(pos) === 1) ir(atual + pos);
    }));
    palco.addEventListener('dragstart', e => e.preventDefault());   // sem isso, o navegador arrasta a <img> e o gesto se perde
    palco.addEventListener('pointerdown', e => { x0 = e.clientX; arrastou = false; });
    palco.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { arrastou = true; ir(atual + (dx < 0 ? 1 : -1)); }   // arrastou para a esquerda: próxima
    });
    carrossel.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') ir(atual + 1);
      else if (e.key === 'ArrowLeft') ir(atual - 1);
    });
  });

  /* ---------- Ano do rodapé ---------- */
  $$('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
