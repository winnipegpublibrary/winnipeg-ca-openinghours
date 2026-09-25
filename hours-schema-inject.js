/**
 * hours-schema-inject.js
 *
 * Drop this one block on every WPL branch page (English and French alike).
 * It figures out which branch the page is for, fetches that branch's
 * pre-generated hours entity JSON from GitHub (a schema.org Library with
 * a nested openingHoursSpecification array -- not a bare array, since
 * OpeningHoursSpecification only validates as a property of a parent
 * entity, not as a standalone type), and injects it into <head> as a
 * <script type="application/ld+json"> tag so search engines pick it up
 * as structured data.
 *
 * REQUIRES: winnipeg_ca_library_hours_translation.js (the hours-widget
 * translation script) to have already run on this page and exposed its
 * branch lookup table as window.WPL_BRANCH_LIDS. That script currently
 * declares BRANCH_LIDS as a local var inside its own IIFE -- add this one
 * line at the end of that file, right after the BRANCH_LIDS map closes,
 * if it isn't there already:
 *
 *     window.WPL_BRANCH_LIDS = BRANCH_LIDS;
 *
 * Without that line, window.WPL_BRANCH_LIDS is undefined and this script
 * will simply do nothing (it fails silently by design -- see below).
 */
(function () {
  var CACHE_BASE = 'https://raw.githubusercontent.com/winnipegpublibrary/winnipeg-ca-openinghours/main/hours-schema';

  var attempts = 0;
  var MAX_ATTEMPTS = 30; /* ~3 seconds at 100ms intervals, then give up quietly */

  function run() {
    if (window.WPL_BRANCH_LIDS) {
      injectSchema(window.WPL_BRANCH_LIDS);
      return;
    }
    if (++attempts > MAX_ATTEMPTS) { return; } /* translation script never loaded -- bail out */
    setTimeout(run, 100);
  }

  function injectSchema(branchMap) {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { return; }

    var slug = canonical.href.replace(/\/$/, '').split('/').pop();
    var lid = branchMap[slug];
    if (!lid) { return; } /* not a recognized branch page -- do nothing */

    fetch(CACHE_BASE + '/' + lid + '.json')
      .then(function (r) { return r.json(); })
      .then(function (spec) {
        if (!spec || !spec.openingHoursSpecification || !spec.openingHoursSpecification.length) { return; } /* e.g. a branch with no scheduled hours right now */
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.textContent = JSON.stringify(spec);
        document.head.appendChild(s);
      })
      .catch(function () {}); /* fail quietly -- a missing/broken fetch shouldn't break the page */
  }

  run();
})();
