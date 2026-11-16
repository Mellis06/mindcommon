const state = {
  consents: { programme: true, research: false, ai: false },
  requests: [
    { id: "REQ-2026-014", requester: "Community Research Team", purpose: "Aggregate programme evaluation", scope: "De-identified synthetic records", status: "Pending" }
  ],
  events: [
    { time: "2026-11-16 09:15", actor: "Amara M. (demo)", action: "Viewed consent settings", detail: "Participant reviewed current permissions." },
    { time: "2026-11-15 14:20", actor: "Governance demo", action: "Access request submitted", detail: "REQ-2026-014 entered the review queue." },
    { time: "2026-11-12 11:05", actor: "Amara M. (demo)", action: "Research consent reviewed", detail: "Research permission remains off." }
  ]
};
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
function event(action, detail) {
  state.events.unshift({ time: new Date().toISOString().slice(0,16).replace("T"," "), actor:"Amara M. (demo)", action, detail });
}
function viewOverview() {
  return `
    <div class="grid">
      <article class="stat"><div class="label">Consent permissions active</div><div class="value">${Object.values(state.consents).filter(Boolean).length} / 3</div><div class="hint">You can change permissions at any time in this demo.</div></article>
      <article class="stat"><div class="label">Requests awaiting review</div><div class="value">${state.requests.filter(r=>r.status==="Pending").length}</div><div class="hint">Each request should state a clear purpose.</div></article>
      <article class="stat"><div class="label">Governance events</div><div class="value">${state.events.length}</div><div class="hint">Illustrative local event history.</div></article>
    </div>
    <div class="section-head"><div><h2>Your data, your decisions</h2><p>A quick view of permissions and decisions in this synthetic participant account.</p></div></div>
    <div class="two-col">
      <section class="panel"><h3>Consent at a glance</h3>
        ${Object.entries({programme:"Programme participation",research:"Research use",ai:"AI development or evaluation"}).map(([key,label])=>`<div class="status-line"><span>${label}</span><span class="pill ${state.consents[key]?"":"revoked"}">${state.consents[key]?"Allowed":"Not allowed"}</span></div>`).join("")}
        <div style="margin-top:15px"><button class="btn" data-go="consent">Review permissions</button></div>
      </section>
      <section class="panel"><h3>Community oversight</h3><p>Individual choices matter, but decisions about shared data use also require community participation, clear accountability, and fair consideration of who benefits.</p><div class="callout"><p>This prototype does not establish collective consent or replace independent ethics review.</p></div></section>
    </div>`;
}
function viewConsent() {
  const labels = {
    programme:["Programme participation","Allow the programme team to use the information needed to deliver the service described to you."],
    research:["Research use","Allow eligible research use under a separately reviewed protocol and defined purpose."],
    ai:["AI development or evaluation","Allow a separately governed use for AI research or evaluation. This does not permit automated clinical decisions."]
  };
  return `<div class="panel"><h3>Permission settings</h3><p>These controls demonstrate purpose-specific choices. They do not constitute legally valid consent in this prototype.</p>
    ${Object.entries(labels).map(([key,[label,description]])=>`<div class="permission"><div><strong>${label}</strong><p>${description}</p></div><button class="switch" role="switch" aria-checked="${state.consents[key]}" data-consent="${key}" aria-label="Toggle ${label}"></button></div>`).join("")}
    <div class="callout"><p>Turning a permission off represents withdrawal for future uses covered by that permission. A real system would need to apply the change across connected workflows and explain any lawful retention requirements.</p></div></div>`;
}
function viewRequests() {
  return `<div class="section-head"><div><h2>Data access requests</h2><p>Review who is asking, why they need access, and the scope of the request.</p></div></div>
    <div class="table-wrap"><table><thead><tr><th>REQUEST</th><th>REQUESTER</th><th>PURPOSE</th><th>SCOPE</th><th>STATUS</th><th>DECISION</th></tr></thead><tbody>
    ${state.requests.map((r,i)=>`<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.requester)}</td><td>${escapeHtml(r.purpose)}</td><td>${escapeHtml(r.scope)}</td><td><span class="pill ${r.status==="Pending"?"pending":r.status==="Rejected"?"revoked":""}">${r.status}</span></td><td>${r.status==="Pending"?`<div class="actions"><button class="btn" data-decision="Approved" data-index="${i}">Approve</button><button class="btn danger" data-decision="Rejected" data-index="${i}">Reject</button></div>`:"—"}</td></tr>`).join("") || '<tr><td colspan="6" class="empty">No requests in this demo.</td></tr>'}
    </tbody></table></div>
    <div class="callout"><p>In a real workflow, approval would require authenticated reviewers, purpose and scope checks, consent verification, conflict-of-interest controls, and enforcement at the data layer. A button click alone must never grant data access.</p></div>`;
}
function viewAudit() {
  return `<div class="section-head"><div><h2>Audit trail</h2><p>Illustrative record of actions in this browser session.</p></div></div><div class="table-wrap"><table><thead><tr><th>TIME</th><th>ACTOR</th><th>EVENT</th><th>DETAIL</th></tr></thead><tbody>${state.events.map(e=>`<tr><td>${escapeHtml(e.time)}</td><td>${escapeHtml(e.actor)}</td><td>${escapeHtml(e.action)}</td><td>${escapeHtml(e.detail)}</td></tr>`).join("")}</tbody></table></div><div class="callout"><p>This client-side list is not tamper-proof, durable, or a security audit log. A production design needs server-side event capture, access controls, monitoring, retention rules, and integrity protections.</p></div>`;
}
function viewCommunity() {
  return `<div class="grid">
    <article class="panel"><h3>Community representation</h3><p>People with lived experience and affected communities should help define acceptable uses, safeguards, and accountability arrangements.</p></article>
    <article class="panel"><h3>Research and secondary use</h3><p>New purposes should be explained and reviewed. Access should not be assumed simply because information was collected for another programme.</p></article>
    <article class="panel"><h3>Benefit-sharing</h3><p>Communities should be able to ask who benefits from research or AI use and how benefits, capacity, or findings return to them.</p></article>
  </div>
  <div class="section-head"><div><h2>Questions for co-design</h2><p>These questions are prompts for community workshops, not predetermined governance rules.</p></div></div>
  <div class="panel">
    <div class="status-line"><span>Who should participate in decisions about data use?</span><span class="pill pending">To be co-designed</span></div>
    <div class="status-line"><span>How can people challenge or appeal an access decision?</span><span class="pill pending">To be co-designed</span></div>
    <div class="status-line"><span>What benefits should return to participating communities?</span><span class="pill pending">To be co-designed</span></div>
    <div class="status-line"><span>How will people be informed about incidents or changes?</span><span class="pill pending">To be co-designed</span></div>
  </div>`;
}
const views = { overview:viewOverview, consent:viewConsent, requests:viewRequests, audit:viewAudit, community:viewCommunity };
function render(name) {
  const selected = views[name] ? name : "overview";
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view===selected));
  $("#page-title").textContent = ({overview:"Overview",consent:"My consent",requests:"Access requests",audit:"Audit trail",community:"Community governance"})[selected];
  $("#view").innerHTML = views[selected]();
}
document.addEventListener("click", (eventObject) => {
  const nav = eventObject.target.closest("[data-view]");
  if (nav) return render(nav.dataset.view);
  const go = eventObject.target.closest("[data-go]");
  if (go) return render(go.dataset.go);
  const toggle = eventObject.target.closest("[data-consent]");
  if (toggle) {
    const key = toggle.dataset.consent;
    state.consents[key] = !state.consents[key];
    event("Consent permission changed", key + " set to " + (state.consents[key] ? "allowed" : "not allowed"));
    return render("consent");
  }
  const decision = eventObject.target.closest("[data-decision]");
  if (decision) {
    const request = state.requests[Number(decision.dataset.index)];
    if (!request || request.status !== "Pending") return;
    const note = window.prompt("Add a short decision note for this demo:");
    if (!note || !note.trim()) return;
    request.status = decision.dataset.decision;
    event("Access request " + request.status.toLowerCase(), request.id + ": " + note.trim());
    return render("requests");
  }
});
render("overview");
