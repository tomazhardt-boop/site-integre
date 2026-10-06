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

  /* ---------- Estilo do mascote (só no protótipo, para comparar) ---------- */
  const MASCOTES = {
    cartoon:  { apontando: 'imagens/mascote-apontando.png', cruzados: 'imagens/mascote-bracos-cruzados.png' },
    aquarela: { apontando: 'imagens/mascote-aquarela.png',  cruzados: 'imagens/mascote-aquarela.png' },
    '3d':     { apontando: 'imagens/mascote-3d.png',        cruzados: 'imagens/mascote-3d.png' }
  };
  const botoes = $$('.troca-mascote button[data-estilo]');
  const aplicarMascote = (estilo) => {
    const set = MASCOTES[estilo];
    if (!set) return;
    $$('img.mascote[data-pose]').forEach(img => { img.src = set[img.dataset.pose]; });
    botoes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.estilo === estilo)));
    try { localStorage.setItem('integre:mascote', estilo); } catch (err) { /* sem storage: só não lembra */ }
  };
  botoes.forEach(b => b.addEventListener('click', () => aplicarMascote(b.dataset.estilo)));
  let salvo = null;
  try { salvo = localStorage.getItem('integre:mascote'); } catch (err) { /* idem */ }
  if (salvo && salvo !== 'cartoon') aplicarMascote(salvo);

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

  /* ---------- Ano do rodapé ---------- */
  $$('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
