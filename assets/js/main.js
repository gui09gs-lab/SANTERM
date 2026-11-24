(function () {
  "use strict";

  /* ===== Configuração ===== */
  var WHATS = "5511996599171";             // número do WhatsApp (com DDI 55 + DDD)
  var EMAIL = "comercial@santerm.com.br";
  var IMG = "assets/img/produtos/";

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var whatsUrl = function (msg) { return "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(msg); };
  var mailUrl = function (subj, body) { return "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); };
  var norm = function (s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  // Termostatos (categoria "controle") não levam o prefixo "Resistência"
  var fullName = function (p) { return p.cat === "controle" ? p.nome : "Resistência " + p.nome; };
  var label = function (p) { return (p.ref ? p.ref + " · " : "") + fullName(p); };

  var produtos = window.PRODUTOS || [];
  var cats = window.CATEGORIAS || {};
  produtos.forEach(function (p, i) {
    p.id = p.ref || "item-" + i;
    p._busca = norm([p.ref, p.nome, p.desc, p.tags, (cats[p.cat] || {}).nome].join(" "));
  });
  var byId = {};
  produtos.forEach(function (p) { byId[p.id] = p; });

  /* ===== Links de WhatsApp ===== */
  $$("[data-whats]").forEach(function (a) {
    a.href = whatsUrl(a.getAttribute("data-whats"));
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ===== Menu mobile ===== */
  var menuBtn = $(".menu-btn"), nav = $("#nav");
  menuBtn.addEventListener("click", function () {
    var open = menuBtn.getAttribute("aria-expanded") !== "true";
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("open", open);
  });
  $$("a", nav).forEach(function (a) {
    a.addEventListener("click", function () {
      menuBtn.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  });

  /* ===== Toast ===== */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  /* ===== Lista de orçamento (salva no navegador) ===== */
  var KEY = "santerm-orcamento";
  var quote = {};
  try { quote = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { quote = {}; }
  Object.keys(quote).forEach(function (id) { if (!byId[id]) delete quote[id]; });
  function saveQuote() {
    try { localStorage.setItem(KEY, JSON.stringify(quote)); } catch (e) { /* sem armazenamento: segue só na memória */ }
    renderQuote();
  }
  function addToQuote(id) {
    quote[id] = (quote[id] || 0) + 1;
    saveQuote();
    var c = $("[data-quote-count]");
    c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
    toast("Adicionado ao orçamento");
  }

  /* ===== Catálogo ===== */
  var grade = $("#grade"), chips = $("#chips"), busca = $("#busca"), resultado = $("#resultado"), vazio = $("#vazio");
  var catAtual = "todos";

  function chip(key, nome, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.cat = key;
    b.setAttribute("aria-pressed", key === catAtual);
    b.innerHTML = nome + "<small>" + n + "</small>";
    b.addEventListener("click", function () {
      catAtual = key;
      $$(".chip", chips).forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.cat === key); });
      renderGrid();
    });
    return b;
  }
  chips.appendChild(chip("todos", "Todos", produtos.length));
  Object.keys(cats).forEach(function (k) {
    var n = produtos.filter(function (p) { return p.cat === k; }).length;
    if (n) chips.appendChild(chip(k, cats[k].nome, n));
  });

  var plus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';

  function cardHTML(p) {
    var inQ = !!quote[p.id];
    return '<article class="card reveal" data-id="' + p.id + '">' +
      '<button class="card__open" type="button" aria-label="Ver detalhes: ' + fullName(p) + '"></button>' +
      '<div class="card__img"><img src="' + IMG + p.img + '" alt="' + fullName(p) + '" loading="lazy" width="800" height="600"></div>' +
      '<div class="card__body">' +
        '<span class="card__ref">' + (p.ref || "Acessório") + '</span>' +
        '<h3 class="card__name">' + p.nome + '</h3>' +
        '<p class="card__cat">' + (cats[p.cat] || {}).nome + '</p>' +
        '<div class="card__actions"><button class="card__add' + (inQ ? " is-in" : "") + '" type="button" data-add="' + p.id + '">' +
          (inQ ? check + " Na lista" : plus + " Orçamento") + '</button></div>' +
      '</div></article>';
  }

  function renderGrid() {
    var q = norm(busca.value.trim());
    var termos = q.split(/\s+/).filter(Boolean);
    var lista = produtos.filter(function (p) {
      if (catAtual !== "todos" && p.cat !== catAtual) return false;
      return termos.every(function (t) { return p._busca.indexOf(t) > -1; });
    });
    grade.innerHTML = lista.map(cardHTML).join("");
    vazio.hidden = lista.length > 0;
    resultado.textContent = (lista.length === 1 ? "1 produto" : lista.length + " produtos") +
      (catAtual !== "todos" ? " em " + cats[catAtual].nome : "") + (q ? " para “" + busca.value.trim() + "”" : "");
    observe($$(".reveal", grade));
  }
  var debounce;
  busca.addEventListener("input", function () { clearTimeout(debounce); debounce = setTimeout(renderGrid, 120); });

  grade.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { addToQuote(add.dataset.add); return; }
    var card = e.target.closest(".card");
    if (card) openModal(byId[card.dataset.id]);
  });

  /* ===== Modal de produto ===== */
  var modal = $("#modal"), modalProd = null;
  function openModal(p) {
    modalProd = p;
    $("#m-img").src = IMG + p.img;
    $("#m-img").alt = fullName(p);
    $("#m-ref").textContent = p.ref ? "REF. " + p.ref : "Acessório";
    $("#m-nome").textContent = fullName(p);
    $("#m-cat").textContent = (cats[p.cat] || {}).nome + " · " + (cats[p.cat] || {}).resumo;
    $("#m-desc").textContent = p.desc;
    $("#m-whats").href = whatsUrl("Olá! Gostaria de um orçamento: " + label(p) + ".");
    $("#m-whats").target = "_blank";
    $("#m-whats").rel = "noopener";
    showDialog(modal);
  }
  $("#m-add").addEventListener("click", function () {
    if (modalProd) addToQuote(modalProd.id);
    closeDialog(modal);
  });

  /* ===== Dialogs ===== */
  function showDialog(d) {
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    document.body.style.overflow = "hidden";
  }
  function closeDialog(d) {
    if (typeof d.close === "function") d.close(); else d.removeAttribute("open");
  }
  $$("dialog").forEach(function (d) {
    d.addEventListener("close", function () { document.body.style.overflow = ""; });
    d.addEventListener("click", function (e) {
      if (e.target === d || e.target.closest("[data-close]")) closeDialog(d);
    });
  });

  /* ===== Gaveta de orçamento ===== */
  var drawer = $("#drawer"), dLista = $("#d-lista"), dObs = $("#d-obs");
  $$("[data-open-quote]").forEach(function (b) { b.addEventListener("click", function () { showDialog(drawer); }); });

  function quoteText() {
    var ids = Object.keys(quote);
    var linhas = ids.map(function (id) { return "• " + quote[id] + "x " + label(byId[id]); });
    var obs = dObs.value.trim();
    return "Olá! Gostaria de um orçamento dos itens abaixo:\n\n" + linhas.join("\n") + (obs ? "\n\nObservações: " + obs : "");
  }
  function renderQuote() {
    var ids = Object.keys(quote);
    var total = ids.reduce(function (s, id) { return s + quote[id]; }, 0);
    $("[data-quote-count]").textContent = total;
    $("#d-vazio").hidden = ids.length > 0;
    $("#d-foot").hidden = ids.length === 0;
    dLista.innerHTML = ids.map(function (id) {
      var p = byId[id];
      return '<li><img src="' + IMG + p.img + '" alt=""><div><strong>' + fullName(p) + '</strong><small>' + (p.ref || "Acessório") + '</small></div>' +
        '<div class="qty"><button type="button" data-dec="' + id + '" aria-label="Diminuir">−</button><span>' + quote[id] + '</span>' +
        '<button type="button" data-inc="' + id + '" aria-label="Aumentar">+</button></div></li>';
    }).join("");
    $$(".card__add", grade).forEach(function (b) {
      var inQ = !!quote[b.dataset.add];
      b.classList.toggle("is-in", inQ);
      b.innerHTML = inQ ? check + " Na lista" : plus + " Orçamento";
    });
  }
  dLista.addEventListener("click", function (e) {
    var inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    if (inc) quote[inc.dataset.inc]++;
    if (dec) { var id = dec.dataset.dec; quote[id]--; if (quote[id] <= 0) delete quote[id]; }
    if (inc || dec) saveQuote();
  });
  $("#d-whats").addEventListener("click", function (e) {
    e.preventDefault();
    window.open(whatsUrl(quoteText()), "_blank", "noopener");
  });
  $("#d-email").addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = mailUrl("Pedido de orçamento pelo site", quoteText());
  });
  $("#d-limpar").addEventListener("click", function () { quote = {}; dObs.value = ""; saveQuote(); });

  /* ===== Calculadora de potência ===== */
  var cSubs = $("#c-subs"), cCustom = $("#c-custom");
  var fmt = function (n, d) { return n.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d }); };
  var num = function (id) { return parseFloat($(id).value.replace(",", ".")); };
  var lastCalc = "";
  function calc() {
    var custom = cSubs.value === "custom";
    cCustom.hidden = !custom;
    var parts = custom ? [num("#c-c"), 1] : cSubs.value.split("|").map(Number);
    var c = parts[0], dens = parts[1];
    var litros = num("#c-vol"), t1 = num("#c-t1"), t2 = num("#c-t2"), t = num("#c-t"), loss = num("#c-loss");
    $("#c-loss-out").textContent = loss + "%";
    var ok = [c, litros, t1, t2, t].every(isFinite) && t > 0 && t2 > t1 && litros > 0 && c > 0;
    if (!ok) {
      $("#c-res").textContent = "—";
      $("#c-det").textContent = t2 <= t1 ? "A temperatura final precisa ser maior que a inicial." : "Preencha todos os campos.";
      lastCalc = "";
      return;
    }
    var m = litros * dens;
    var kw = (m * c * (t2 - t1)) / (860 * t);
    var w = Math.ceil((kw * (1 + loss / 100) * 1000) / 10) * 10;
    $("#c-res").textContent = fmt(w, 0) + " W";
    $("#c-det").textContent = "Teórico: " + fmt(kw, 2) + " kW + " + loss + "% de margem (" + fmt(w / 1000, 2) + " kW)";
    lastCalc = "Calculei no site: aquecer " + fmt(litros, 0) + " L de " + cSubs.options[cSubs.selectedIndex].text.toLowerCase() +
      " de " + t1 + " °C para " + t2 + " °C em " + fmt(t, 1) + " h. Potência estimada: " + fmt(w, 0) + " W.";
  }
  $("#calc").addEventListener("input", calc);
  $("#calc").addEventListener("submit", function (e) { e.preventDefault(); });
  $("#c-send").addEventListener("click", function (e) {
    e.preventDefault();
    window.open(whatsUrl("Olá! Preciso de uma resistência. " + (lastCalc || "")), "_blank", "noopener");
  });
  calc();

  /* ===== Formulário de contato ===== */
  var form = $("#contato-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var via = e.submitter ? e.submitter.dataset.via : "whats";
    var nome = $("#f-nome").value.trim(), emp = $("#f-empresa").value.trim(), msg = $("#f-msg").value.trim();
    var erro = $("#f-erro");
    if (!nome || !msg) { erro.hidden = false; (nome ? $("#f-msg") : $("#f-nome")).focus(); return; }
    erro.hidden = true;
    var texto = "Olá! Meu nome é " + nome + (emp ? ", da " + emp : "") + ".\n\n" + msg;
    if (via === "email") window.location.href = mailUrl("Orçamento pelo site — " + nome, texto);
    else window.open(whatsUrl(texto), "_blank", "noopener");
  });

  /* ===== Animação de entrada ===== */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -40px 0px" }) : null;
  function observe(els) {
    els.forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });
  }
  $$(".section__head, .steps li, .materials, .calc__form, .about__badge, .about__copy, .faq__list details, .channels li, .contact__form")
    .forEach(function (el) { el.classList.add("reveal"); });
  observe($$(".reveal"));

  $("#ano").textContent = new Date().getFullYear();
  renderGrid();
  renderQuote();
})();
