// Pricing page: opens the Paddle checkout for a [data-price-id] button.
// Paddle.js is loaded only on the first click, so visitors who only read prices contact no third party.
(() => {
  const me = document.currentScript;
  const cfg = me.dataset;
  let ready = null;

  function loadPaddle() {
    if (!ready) {
      ready = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
        s.onload = () => {
          if (cfg.environment === "sandbox") window.Paddle.Environment.set("sandbox");
          window.Paddle.Initialize({ token: cfg.token });
          resolve(window.Paddle);
        };
        s.onerror = () => { ready = null; reject(new Error("paddle.js failed to load")); };
        document.head.appendChild(s);
      });
    }
    return ready;
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-price-id]");
    if (!btn) return;
    btn.disabled = true;
    try {
      const Paddle = await loadPaddle();
      Paddle.Checkout.open({
        items: [{ priceId: btn.dataset.priceId, quantity: 1 }],
        settings: { displayMode: "overlay", variant: "one-page", successUrl: cfg.successUrl },
      });
    } catch (err) {
      document.querySelector("[data-checkout-error]")?.removeAttribute("hidden");
    } finally {
      btn.disabled = false;
    }
  });
})();
