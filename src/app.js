(() => {
  "use strict";

  const API_BASE = window.MINDCOMMON_CONFIG?.apiBase || (window.location.origin + "/api");
  const PURPOSES = {
    programme: {
      label: "Programme participation",
      description: "Allow the programme team to use the minimum information needed to deliver the service described to you."
    },
    research: {
      label: "Research use",
      description: "Allow eligible research use under a separately reviewed protocol, with a defined purpose and scope."
    },
    ai: {
      label: "AI development or evaluation",
      description: "Allow a separately governed use for AI research or evaluation. This does not permit automated clinical decisions."
    }
  };

  const state = {
    user: null,
    view: "overview",
    authMode: "login",
    consents: [],
    requests: [],
    events: []
  };

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function initials(name) {
    return String(name || "M").trim().split(/\s+/).slice(0, 2)
      .map(part => part.charAt(0).toUpperCase()).join("");
  }

  async function api(path, options) {
    const config = options || {};
    const headers = Object.assign({ Accept: "application/json" }, config.headers || {});
    const requestOptions = {
      method: config.method || "GET",
      credentials: "include",
      cache: "no-store",
      headers
    };

    if (config.body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(config.body);
    }

    let response;
    try {
      response = await fetch(API_BASE + path, requestOptions);
    } catch (error) {
      throw new Error("Could not reach the MINDCOMMON API. Check that the server is running and the frontend origin is allowed.");
    }

    let payload = null;
    if (response.status !== 204) payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && payload.message ? payload.message : "Request failed (" + response.status + ").";
      throw Object.assign(new Error(message), { status: response.status });
    }
    return payload;
  }

  function flash(message, type) {
    const authVisible = $("#auth-shell") && !$("#auth-shell").hidden;
    const target = authVisible ? $("#auth-flash") : $("#flash");
    if (!target) return;
    target.textContent = message || "";
    target.className = "flash" + (type === "error" ? " error" : "");
    target.hidden = !message;
  }

  function setBusy(form, busy) {
    $$("button", form).forEach(button => { button.disabled = busy; });
  }

  function showAuth() {
    $("#app-shell").hidden = true;
    $("#auth-shell").hidden = false;
    renderAuth();
  }

  function renderAuth() {
    const registering = state.authMode === "register";
    const html = [
      '<section class="auth-card">',
      '<a class="brand auth-brand" href="#" aria-label="MINDCOMMON home"><span class="brand-mark">M</span><span><strong>MINDCOMMON</strong><small>COMMUNITY DATA GOVERNANCE</small></span></a>',
      '<span class="eyebrow">PUBLIC INTEREST TECHNOLOGY</span>',
      '<h1>' + (registering ? "Create your account" : "Welcome back") + '</h1>',
      '<p class="auth-intro">' + (registering
        ? "Create a participant account to explore the synthetic governance demonstration."
        : "Sign in to review consent choices and governance requests in the prototype.") + '</p>',
      '<div class="auth-warning"><strong>Prototype notice</strong><p>Use a fictional name and synthetic information. Do not enter real mental-health, patient, or participant data.</p></div>',
      '<div id="auth-flash" class="flash" role="status" aria-live="polite" hidden></div>',
      '<form id="auth-form" data-mode="' + (registering ? "register" : "login") + '">',
      registering ? '<label for="auth-name">Name</label><input id="auth-name" name="name" autocomplete="name" maxlength="100" minlength="2" required>' : "",
      '<label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required>',
      '<label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="' + (registering ? "new-password" : "current-password") + '" minlength="' + (registering ? "12" : "1") + '" maxlength="128" required>',
      '<p class="field-hint">' + (registering
        ? "Use at least 12 characters. This is a demo account, not a real patient identity."
        : "Reviewer and administrator accounts must be provisioned separately by a trusted maintainer.") + '</p>',
      '<button class="btn auth-submit" type="submit">' + (registering ? "Create account" : "Sign in") + '</button>',
      '</form>',
      '<p class="auth-switch">' + (registering
        ? 'Already registered? <button type="button" class="text-button" data-auth-mode="login">Sign in</button>'
        : 'New to the prototype? <button type="button" class="text-button" data-auth-mode="register">Create an account</button>') + '</p>',
      '<p class="auth-api">API endpoint: <code>' + escapeHtml(API_BASE) + '</code></p>',
      '</section>'
    ];
    $("#auth-shell").innerHTML = html.join("");
  }

  function showApp() {
    $("#auth-shell").hidden = true;
    $("#app-shell").hidden = false;
    showAppHeader();
    render();
  }

  function showAppHeader() {
    if (!state.user) return;
    $("#user-chip").innerHTML =
      '<span class="avatar">' + escapeHtml(initials(state.user.name)) + '</span>' +
      '<span><strong>' + escapeHtml(state.user.name) + '</strong><small>' +
      escapeHtml(state.user.role) + ' · ' + escapeHtml(state.user.email) + '</small></span>';
  }

  function latestConsentMap() {
    const latest = {};
    // The API returns newest first; retain the first event for each purpose.
    for (const record of state.consents) {
      if (!latest[record.purpose]) latest[record.purpose] = record;
    }
    return latest;
  }

  async function loadData() {
    const results = await Promise.all([
      api("/consents/me"),
      api("/access-requests"),
      api("/audit-events/me")
    ]);
    state.consents = Array.isArray(results[0] && results[0].records) ? results[0].records : [];
    state.requests = Array.isArray(results[1] && results[1].requests) ? results[1].requests : [];
    state.events = Array.isArray(results[2] && results[2].events) ? results[2].events : [];
  }

  function statusPill(status) {
    const styles = { granted: "approved", withdrawn: "revoked", pending: "pending", approved: "approved", rejected: "revoked" };
    return '<span class="pill ' + (styles[status] || "") + '">' + escapeHtml(status) + '</span>';
  }

  function viewOverview() {
    const latest = latestConsentMap();
    const granted = Object.values(latest).filter(record => record.status === "granted").length;
    const pending = state.requests.filter(request => request.status === "pending").length;
    const roleLabel = ["reviewer", "admin"].includes(state.user.role) ? "Requests awaiting your review" : "Your pending requests";

    const consentRows = Object.keys(PURPOSES).map(key => {
      const record = latest[key];
      const status = record ? record.status : "Not set";
      return '<div class="status-line"><span>' + escapeHtml(PURPOSES[key].label) + '</span>' +
        (record ? statusPill(status) : '<span class="pill pending">Not set</span>') + '</div>';
    }).join("");

    return [
      '<div class="grid">',
      '<article class="stat"><div class="label">Purpose permissions granted</div><div class="value">' + granted + ' / 3</div><div class="hint">Based on the latest recorded choice for each purpose.</div></article>',
      '<article class="stat"><div class="label">' + escapeHtml(roleLabel) + '</div><div class="value">' + pending + '</div><div class="hint">All proposals are restricted to synthetic demo scope.</div></article>',
      '<article class="stat"><div class="label">Governance events</div><div class="value">' + state.events.length + '</div><div class="hint">Events recorded by the API for your account.</div></article>',
      '</div>',
      '<div class="section-head"><div><h2>Your data, your decisions</h2><p>Consent history and access decisions are loaded from the MINDCOMMON API.</p></div><button type="button" class="btn secondary" data-action="refresh">Refresh</button></div>',
      '<div class="two-col"><section class="panel"><h3>Consent at a glance</h3>' + consentRows +
      '<div class="panel-actions"><button class="btn" data-go="consent" type="button">Review permissions</button></div></section>',
      '<section class="panel"><h3>Community oversight</h3><p>Individual choices matter, but decisions about shared data use also require community participation, clear accountability, and fair consideration of who benefits.</p><div class="callout"><p>These account-level controls do not establish collective consent or replace independent ethics review.</p></div></section></div>'
    ].join("");
  }

  function viewConsent() {
    const latest = latestConsentMap();
    const cards = Object.keys(PURPOSES).map(key => {
      const purpose = PURPOSES[key];
      const record = latest[key];
      const granted = record && record.status === "granted";
      const status = record ? record.status : "not set";
      const action = granted ? "withdrawn" : "granted";
      const button = granted
        ? '<button type="button" class="btn danger" data-consent="' + key + '" data-status="withdrawn">Withdraw</button>'
        : '<button type="button" class="btn" data-consent="' + key + '" data-status="granted">Grant permission</button>';
      return '<div class="permission permission-card"><div class="permission-copy"><strong>' + escapeHtml(purpose.label) +
        '</strong><p>' + escapeHtml(purpose.description) + '</p><small>Latest choice: ' + escapeHtml(status) +
        (record ? ' · ' + escapeHtml(formatDate(record.createdAt)) : "") + '</small></div><div class="permission-actions">' +
        button + '</div></div>';
    }).join("");

    return '<div class="section-head"><div><h2>Purpose-specific permissions</h2><p>Each choice is saved as a new consent record. Earlier records remain in your history.</p></div></div>' +
      '<div class="panel">' + cards + '<div class="callout"><p>A real deployment must explain each purpose in accessible language, record the notice shown, and apply withdrawal to future processing wherever the permission is relied upon. This prototype records choices but is not a legally sufficient consent process.</p></div></div>';
  }

  function viewMemberRequests() {
    const rows = state.requests.map(request => {
      const reference = String(request._id || "").slice(-8);
      return '<tr><td><code>' + escapeHtml(reference) + '</code></td><td>' + escapeHtml(request.recipientName) +
        '</td><td>' + escapeHtml(request.recipientOrganisation) + '</td><td>' +
        escapeHtml(PURPOSES[request.purpose] ? PURPOSES[request.purpose].label : request.purpose) +
        '</td><td>' + statusPill(request.status) + '</td><td>' +
        escapeHtml(request.reviewNote || "Awaiting review") + '</td></tr>';
    }).join("");

    return [
      '<div class="section-head"><div><h2>Propose a data-use request</h2><p>In this demo, you are proposing a use of a synthetic record. No health information is transferred.</p></div></div>',
      '<section class="panel"><form id="request-form" class="form-grid">',
      '<div><label for="recipient-name">Recipient name</label><input id="recipient-name" name="recipientName" required minlength="2" maxlength="100" placeholder="e.g. Community Research Team"></div>',
      '<div><label for="recipient-org">Recipient organisation</label><input id="recipient-org" name="recipientOrganisation" required minlength="2" maxlength="120" placeholder="Organisation or institution"></div>',
      '<div><label for="request-purpose">Purpose</label><select id="request-purpose" name="purpose" required><option value="programme">Programme participation</option><option value="research">Research use</option><option value="ai">AI development or evaluation</option></select></div>',
      '<div><label for="request-scope">Data scope</label><input id="request-scope" value="Synthetic demonstration only" disabled><input type="hidden" name="scope" value="synthetic-demo"></div>',
      '<div class="span-2"><label for="request-rationale">Why is this use being proposed?</label><textarea id="request-rationale" name="rationale" required minlength="20" maxlength="500" rows="3" placeholder="Describe the specific purpose and expected public benefit."></textarea></div>',
      '<div class="span-2 form-footer"><p class="field-hint">A reviewer or community steward will review the proposal. Approval does not provide access to actual records.</p><button class="btn" type="submit">Submit proposal</button></div>',
      '</form></section>',
      '<div class="section-head"><div><h2>Your proposals</h2><p>Track the status and reviewer notes for each proposal.</p></div><button type="button" class="btn secondary" data-action="refresh">Refresh</button></div>',
      '<div class="table-wrap"><table><thead><tr><th>REFERENCE</th><th>RECIPIENT</th><th>ORGANISATION</th><th>PURPOSE</th><th>STATUS</th><th>REVIEW NOTE</th></tr></thead><tbody>',
      rows || '<tr><td colspan="6" class="empty">You have not submitted any proposals yet.</td></tr>',
      '</tbody></table></div>'
    ].join("");
  }

  function viewReviewerRequests() {
    const pending = state.requests.filter(request => request.status === "pending");
    const reviewed = state.requests.filter(request => request.status !== "pending");

    function reviewCard(request) {
      const member = request.submittedBy || {};
      const memberId = member._id || member;
      const own = String(memberId) === String(state.user.id);
      const identity = member && member.name
        ? escapeHtml(member.name) + (member.email ? " (" + escapeHtml(member.email) + ")" : "")
        : "Member";
      let actionMarkup = "";

      if (request.status === "pending" && !own) {
        actionMarkup = '<form class="review-form" data-review-id="' + escapeHtml(request._id) + '">' +
          '<label for="review-note-' + escapeHtml(request._id) + '">Decision note</label>' +
          '<textarea id="review-note-' + escapeHtml(request._id) + '" name="reviewNote" minlength="10" maxlength="500" required rows="2" placeholder="Explain the governance reason for your decision."></textarea>' +
          '<div class="actions"><button class="btn" type="submit" name="decision" value="approved">Approve proposal</button><button class="btn danger" type="submit" name="decision" value="rejected">Reject proposal</button></div></form>';
      } else {
        const note = request.reviewNote || (own ? "Self-review is not permitted." : "No note recorded.");
        actionMarkup = '<div class="review-note"><strong>' + (own && request.status === "pending" ? "Your own request" : "Review note") + '</strong><p>' + escapeHtml(note) + '</p></div>';
      }

      return '<article class="review-card"><div class="review-head"><div><span class="eyebrow">ACCESS PROPOSAL</span><h3>' +
        escapeHtml(request.recipientName) + ' · ' + escapeHtml(request.recipientOrganisation) +
        '</h3><p>Submitted by ' + identity + '</p></div>' + statusPill(request.status) + '</div>' +
        '<div class="review-meta"><span><strong>Purpose</strong>' + escapeHtml(PURPOSES[request.purpose] ? PURPOSES[request.purpose].label : request.purpose) +
        '</span><span><strong>Scope</strong>Synthetic demo only</span><span><strong>Submitted</strong>' + escapeHtml(formatDate(request.createdAt)) +
        '</span></div><p class="review-rationale">' + escapeHtml(request.rationale) + '</p>' + actionMarkup + '</article>';
    }

    return '<div class="section-head"><div><h2>Reviewer queue</h2><p>Review purpose, scope, consent status and rationale. Decisions apply only to synthetic demo requests.</p></div><button type="button" class="btn secondary" data-action="refresh">Refresh queue</button></div>' +
      (pending.length ? pending.map(reviewCard).join("") : '<div class="panel empty-panel">There are no requests awaiting review.</div>') +
      (reviewed.length ? '<div class="section-head"><div><h2>Previously reviewed</h2><p>Decision history available to this reviewer account.</p></div></div>' + reviewed.map(reviewCard).join("") : "");
  }

  function viewRequests() {
    return ["reviewer", "admin"].includes(state.user.role) ? viewReviewerRequests() : viewMemberRequests();
  }

  function viewAudit() {
    const rows = state.events.map(event => {
      const actor = event.actorId && typeof event.actorId === "object" ? event.actorId.name : "Account event";
      const detail = event.details && Object.keys(event.details).length ? JSON.stringify(event.details) : "—";
      return '<tr><td>' + escapeHtml(formatDate(event.createdAt)) + '</td><td>' + escapeHtml(actor || "Account event") +
        '</td><td>' + escapeHtml(event.action) + '</td><td>' + escapeHtml(event.resourceType) + ' ' + escapeHtml(detail) + '</td></tr>';
    }).join("");

    return '<div class="section-head"><div><h2>Audit trail</h2><p>Server-recorded governance events performed by or concerning your account.</p></div><button type="button" class="btn secondary" data-action="refresh">Refresh</button></div>' +
      '<div class="table-wrap"><table><thead><tr><th>TIME</th><th>ACTOR</th><th>EVENT</th><th>DETAILS</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4" class="empty">No audit events are available for this account.</td></tr>') +
      '</tbody></table></div><div class="callout"><p>Events are stored by the API and are append-only through application routes. This does not make database records cryptographically immutable or prevent privileged infrastructure administrators from changing them.</p></div>';
  }

  function viewCommunity() {
    return '<div class="grid">' +
      '<article class="panel"><h3>Community representation</h3><p>People with lived experience and affected communities should help define acceptable uses, safeguards, and accountability arrangements.</p></article>' +
      '<article class="panel"><h3>Research and secondary use</h3><p>New purposes should be explained and reviewed. Access should not be assumed simply because information was collected for another programme.</p></article>' +
      '<article class="panel"><h3>Benefit-sharing</h3><p>Communities should be able to ask who benefits from research or AI use and how benefits, capacity, or findings return to them.</p></article></div>' +
      '<div class="section-head"><div><h2>Questions for co-design</h2><p>These questions are prompts for community workshops, not predetermined governance rules.</p></div></div>' +
      '<div class="panel"><div class="status-line"><span>Who should participate in decisions about data use?</span><span class="pill pending">To be co-designed</span></div>' +
      '<div class="status-line"><span>How can people challenge or appeal an access decision?</span><span class="pill pending">To be co-designed</span></div>' +
      '<div class="status-line"><span>What benefits should return to participating communities?</span><span class="pill pending">To be co-designed</span></div>' +
      '<div class="status-line"><span>How will people be informed about incidents or changes?</span><span class="pill pending">To be co-designed</span></div></div>';
  }

  const views = {
    overview: { title: "Overview", render: viewOverview },
    consent: { title: "My consent", render: viewConsent },
    requests: { title: "Access requests", render: viewRequests },
    audit: { title: "Audit trail", render: viewAudit },
    community: { title: "Community governance", render: viewCommunity }
  };

  function render() {
    if (!state.user) return showAuth();
    if (!views[state.view]) state.view = "overview";
    $("#app-shell").hidden = false;
    $("#auth-shell").hidden = true;
    $("#page-title").textContent = views[state.view].title;
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === state.view));
    $("#view").innerHTML = views[state.view].render();
    showAppHeader();
  }

  function handleApiError(error) {
    if (error.status === 401) {
      state.user = null;
      state.consents = [];
      state.requests = [];
      state.events = [];
      state.authMode = "login";
      showAuth();
      flash(error.message, "error");
      return;
    }
    flash(error.message || "Something went wrong. Please try again.", "error");
  }

  async function submitAuth(form) {
    const mode = form.dataset.mode;
    const values = new FormData(form);
    const body = mode === "register"
      ? { name: values.get("name"), email: values.get("email"), password: values.get("password") }
      : { email: values.get("email"), password: values.get("password") };

    setBusy(form, true);
    try {
      const response = await api("/auth/" + mode, { method: "POST", body });
      state.user = response.user;
      state.view = "overview";
      await loadData();
      showApp();
      flash(mode === "register" ? "Your demo account has been created." : "You are signed in.");
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(form, false);
    }
  }

  async function submitRequest(form) {
    const values = new FormData(form);
    const body = {
      recipientName: values.get("recipientName"),
      recipientOrganisation: values.get("recipientOrganisation"),
      purpose: values.get("purpose"),
      scope: "synthetic-demo",
      rationale: values.get("rationale")
    };
    setBusy(form, true);
    try {
      await api("/access-requests", { method: "POST", body });
      await loadData();
      render();
      flash("Your synthetic-data use proposal has been submitted.");
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(form, false);
    }
  }

  async function submitReview(form, submitter) {
    const status = submitter && submitter.value;
    const reviewNote = new FormData(form).get("reviewNote");
    if (!["approved", "rejected"].includes(status)) {
      flash("Choose approve or reject to record a decision.", "error");
      return;
    }
    setBusy(form, true);
    try {
      await api("/access-requests/" + encodeURIComponent(form.dataset.reviewId) + "/review", {
        method: "POST",
        body: { status, reviewNote }
      });
      await loadData();
      render();
      flash("The proposal was " + status + ".");
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(form, false);
    }
  }

  async function changeConsent(purpose, status) {
    try {
      await api("/consents", {
        method: "POST",
        body: { purpose, status, noticeVersion: "mindcommon-demo-v0.3" }
      });
      await loadData();
      render();
      flash(PURPOSES[purpose].label + ": " + (status === "granted" ? "permission recorded." : "withdrawal recorded."));
    } catch (error) {
      handleApiError(error);
    }
  }

  async function refreshData() {
    try {
      await loadData();
      render();
      flash("Information refreshed from the API.");
    } catch (error) {
      handleApiError(error);
    }
  }

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      // Clear the current browser view even if the API cannot be reached.
    }
    state.user = null;
    state.consents = [];
    state.requests = [];
    state.events = [];
    state.view = "overview";
    state.authMode = "login";
    showAuth();
    flash("You have been signed out.");
  }

  document.addEventListener("click", async event => {
    const modeButton = event.target.closest("[data-auth-mode]");
    if (modeButton) {
      state.authMode = modeButton.dataset.authMode;
      renderAuth();
      return;
    }

    const nav = event.target.closest("[data-view]");
    if (nav && state.user) {
      state.view = nav.dataset.view;
      render();
      return;
    }

    const go = event.target.closest("[data-go]");
    if (go && state.user) {
      state.view = go.dataset.go;
      render();
      return;
    }

    const consent = event.target.closest("[data-consent]");
    if (consent && state.user) {
      await changeConsent(consent.dataset.consent, consent.dataset.status);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action && action.dataset.action === "refresh") await refreshData();
  });

  document.addEventListener("submit", async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();

    if (form.id === "auth-form") await submitAuth(form);
    else if (form.id === "request-form") await submitRequest(form);
    else if (form.matches("[data-review-id]")) await submitReview(form, event.submitter);
  });

  $("#signout-button").addEventListener("click", signOut);

  async function initialise() {
    try {
      await api("/health");
    } catch (error) {
      showAuth();
      flash(error.message, "error");
      return;
    }

    try {
      const response = await api("/auth/me");
      state.user = response.user;
      await loadData();
      showApp();
    } catch (error) {
      showAuth();
      if (error.status !== 401) flash(error.message, "error");
    }
  }

  initialise();
})();
