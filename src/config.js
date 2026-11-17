(() => {
  "use strict";
  const meta = document.querySelector('meta[name="mindcommon-api-base"]');
  const configured = meta && meta.content ? meta.content.trim() : "";
  const apiBase = configured || (window.location.origin + "/api");
  window.MINDCOMMON_CONFIG = Object.freeze({
    apiBase: apiBase.replace(/\/+$/, "")
  });
})();
