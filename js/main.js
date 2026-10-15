/* Seminar portfolio: menu button on small screens, the List of Outputs
   dropdown, light/dark mode and the image viewer.
   Everything still works without this file: the menu shows open and
   images open on their own when clicked. */
(function () {
  "use strict";

  /* Menu (phones and tablets) -------------------------------------------- */
  var bar = document.querySelector(".topbar");
  var menuBtn = document.querySelector(".menu-btn");

  function setMenu(open) {
    bar.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.querySelector(".menu-btn-text").textContent = open ? "Close" : "Menu";
  }

  if (bar && menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!bar.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && bar.classList.contains("is-open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    var wide = window.matchMedia("(min-width: 1024px)");
    var onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* List of Outputs dropdown (computers) ----------------------------------
     Opens over the page while the mouse rests on List of Outputs. The arrow
     button opens or closes it with a click, a tap or the keyboard. */
  var sub = document.querySelector(".has-sub");
  var subBtn = document.querySelector(".sub-toggle");

  if (sub && subBtn) {
    var hovering = false;   // the mouse is over List of Outputs or its menu
    var pinned = false;     // opened with the arrow
    var muted = false;      // closed with the arrow while the mouse is still over it
    var leaveTimer = null;

    var render = function () {
      var open = pinned || (hovering && !muted);
      sub.classList.toggle("is-open", open);
      subBtn.setAttribute("aria-expanded", String(open));
    };

    sub.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      clearTimeout(leaveTimer);
      hovering = true;
      render();
    });
    sub.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () {   // a short pause forgives small slips
        hovering = false;
        muted = false;
        render();
      }, 200);
    });

    subBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = sub.classList.contains("is-open");
      pinned = !open;
      muted = open && hovering;
      render();
    });

    // close when focus or a click moves somewhere else, or on Escape
    sub.addEventListener("focusout", function (e) {
      if (!sub.contains(e.relatedTarget)) { pinned = false; render(); }
    });
    document.addEventListener("click", function (e) {
      if (!sub.contains(e.target)) { pinned = false; render(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sub.classList.contains("is-open")) {
        pinned = false;
        muted = hovering;
        render();
        subBtn.focus();
      }
    });
  }

  /* Light and dark mode ------------------------------------------------------
     Starts from the device setting; the button switches modes and the choice
     is remembered on every page. */
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-btn");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  var currentTheme = function () {
    var chosen = root.getAttribute("data-theme");
    if (chosen === "dark" || chosen === "light") return chosen;
    return systemDark.matches ? "dark" : "light";
  };
  var syncThemeBtn = function () {
    var dark = currentTheme() === "dark";
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  };

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode: not saved */ }
      syncThemeBtn();
    });
    if (systemDark.addEventListener) systemDark.addEventListener("change", syncThemeBtn);
    else if (systemDark.addListener) systemDark.addListener(syncThemeBtn);
    syncThemeBtn();
  }

  /* Image viewer --------------------------------------------------------- */
  var dialog = document.getElementById("lightbox");
  var links = Array.prototype.slice.call(document.querySelectorAll("a[data-gallery]"));
  if (!dialog || !links.length || typeof dialog.showModal !== "function") return;

  var img = dialog.querySelector(".lb-img");
  var caption = dialog.querySelector(".lb-caption");
  var count = dialog.querySelector(".lb-count");
  var prevBtn = dialog.querySelector(".lb-prev");
  var nextBtn = dialog.querySelector(".lb-next");
  var closeBtn = dialog.querySelector(".lb-close");
  var group = [];
  var index = 0;
  var opener = null;

  function show(i) {
    index = (i + group.length) % group.length;
    var link = group[index];
    var thumb = link.querySelector("img");
    img.src = link.getAttribute("href");
    img.alt = thumb ? thumb.alt : "";
    caption.textContent = link.getAttribute("data-caption") || "";
    var single = group.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
    count.hidden = single;
    count.textContent = (index + 1) + " of " + group.length;
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      var name = link.getAttribute("data-gallery");
      group = links.filter(function (l) { return l.getAttribute("data-gallery") === name; });
      opener = link;
      show(group.indexOf(link));
      dialog.showModal();
      closeBtn.focus();
    });
  });

  prevBtn.addEventListener("click", function () { show(index - 1); });
  nextBtn.addEventListener("click", function () { show(index + 1); });
  closeBtn.addEventListener("click", function () { dialog.close(); });

  dialog.addEventListener("keydown", function (e) {
    if (group.length < 2) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });

  // Clicking the dark area around the picture closes the viewer
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || e.target.classList.contains("lb-stage")) dialog.close();
  });

  dialog.addEventListener("close", function () {
    img.removeAttribute("src");
    if (opener) opener.focus();
  });

  // Swipe left or right to change pictures on touch screens
  var startX = null;
  dialog.addEventListener("touchstart", function (e) {
    startX = e.touches.length === 1 ? e.touches[0].clientX : null;
  }, { passive: true });
  dialog.addEventListener("touchend", function (e) {
    if (startX === null || group.length < 2) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
