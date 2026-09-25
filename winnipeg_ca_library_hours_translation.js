(function () {
  var CURRENT_SCRIPT = document.currentScript;
  var IID = 3164;

  // ── Branch URL slug → LibCal lid ─────────────────────────────────────────

  var BRANCH_LIDS = {
    // EN slugs
    'millennium-library'             : 1262,
    'bill-and-helen-norrie-library'  : 7343,
    'charleswood-library'            : 1264,
    'cornish-library'                : 1265,
    'fort-garry-library'             : 1266,
    'harvey-smith-library'           : 1280,
    'henderson-library'              : 1268,
    'louis-riel-library'             : 1269,
    'munroe-library'                 : 1270,
    'osborne-library'                : 1271,
    'pembina-trail-library'          : 1272,
    'st-boniface-library'            : 1274,
    'st-james-assiniboia-library'    : 1275,
    'st-johns-library'               : 1276,
    'st-vital-library'               : 1277,
    'sir-william-stephenson-library' : 1278,
    'transcona-library'              : 1279,
    'west-kildonan-library'          : 1281,
    'westwood-library'               : 1282,
    'windsor-park-library'           : 1283,
    // FR slugs
    'bibliotheque-millenaire'            : 1262,
    'bibliotheque-bill-helen-norrie'     : 7343,
    'bibliotheque-charleswood'           : 1264,
    'bibliotheque-cornish'               : 1265,
    'bibliotheque-fort-garry'            : 1266,
    'bibliotheque-harvey-smith'          : 1280,
    'bibliotheque-henderson'             : 1268,
    'bibliotheque-louis-riel'            : 1269,
    'bibliotheque-munroe'                : 1270,
    'bibliotheque-osborne'               : 1271,
    'bibliotheque-pembina-trail'         : 1272,
    'bibliotheque-saint-boniface'        : 1274,
    'bibliotheque-st-james-assiniboia'   : 1275,
    'bibliotheque-st-johns'              : 1276,
    'bibliotheque-saint-vital'           : 1277,
    'bibliotheque-sir-william-stephenson': 1278,
    'bibliotheque-transcona'             : 1279,
    'bibliotheque-kildonan-ouest'        : 1281,
    'bibliotheque-westwood'              : 1282,
    'bibliotheque-windsor-park'          : 1283,
  };
  window.WPL_BRANCH_LIDS = BRANCH_LIDS;
  var slug = window.location.pathname.replace(/\/$/, '').split('/').pop();
  var lid  = BRANCH_LIDS[slug];

  // Not a branch page — do nothing
  if (!lid) return;

  var lang     = document.documentElement.lang || navigator.language || '';
  var isFrench = lang.startsWith('fr') || new URLSearchParams(window.location.search).has('fr');
  var isMobile = window.innerWidth < 768;

  // ── Translate heading ─────────────────────────────────────────────────────
  var heading = document.getElementById('wpl-hours-heading');
  if (heading && isFrench) heading.textContent = 'Heures';

  // ── Translation maps ──────────────────────────────────────────────────────

  var DAYS_FULL = {
    'Sunday':'dimanche','Monday':'lundi','Tuesday':'mardi','Wednesday':'mercredi',
    'Thursday':'jeudi','Friday':'vendredi','Saturday':'samedi'
  };

  var DAYS = {
    'Sunday':'dimanche','Monday':'lundi','Tuesday':'mardi','Wednesday':'mercredi',
    'Thursday':'jeudi','Friday':'vendredi','Saturday':'samedi',
    'Sun':'dim','Mon':'lun','Tue':'mar','Wed':'mer','Thu':'jeu','Fri':'ven','Sat':'sam'
  };

  var MONTHS = {
    'January':'janvier',    'February':'février',   'March':'mars',      'April':'avril',
    'May':'mai',            'June':'juin',           'July':'juillet',    'August':'août',
    'September':'septembre','October':'octobre',     'November':'novembre','December':'décembre',
    'Jan':'jan','Feb':'fév','Mar':'mars','Apr':'avr','May':'mai',
    'Jun':'juin','Jul':'juil','Aug':'août','Sep':'sept','Oct':'oct','Nov':'nov','Dec':'déc'
  };

  var HOLIDAYS = {
    'New Year\'s Day'       : 'Jour de l\'An',
    'Good Friday'           : 'Vendredi saint',
    'Easter Monday'         : 'Lundi de Pâques',
    'Victoria Day'          : 'Fête de la Reine',
    'Canada Day'            : 'Fête du Canada',
    'Terry Fox Day'         : 'Journée Terry Fox',
    'Labour Day'            : 'Fête du Travail',
    'National Day for Truth and Reconciliation' : 'Journée nationale de la vérité et de la réconciliation',
    'Thanksgiving'          : 'Action de grâce',
    'Remembrance Day'       : 'Jour du Souvenir',
    'Christmas Day'         : 'Jour de Noël',
    'Boxing Day'            : 'Lendemain de Noël',
  };

  var PHRASES = {
    'Previous week' : 'Semaine précédente',
    'Next week'     : 'Semaine suivante',
    'Previous'      : 'Précédent',
    'Next'          : 'Suivant',
    'All Locations' : 'Toutes les bibliothèques',
    'Closed'        : 'Fermé',
    'Open'          : 'Ouvert',
    'Today'         : 'Aujourd\'hui',
    'Hours'         : 'Heures',
  };

  // ── Translation helpers ───────────────────────────────────────────────────

  function toFrenchTime(text) {
    return text.replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi, function (_, h, m, p) {
      var hour = parseInt(h, 10);
      var min  = m ? parseInt(m, 10) : 0;
      if (p.toLowerCase() === 'pm' && hour !== 12) hour += 12;
      if (p.toLowerCase() === 'am' && hour === 12)  hour  = 0;
      return (hour < 10 ? '0' + hour : hour) + 'h' + (min < 10 ? '0' + min : min);
    });
  }

  function flipDate(text) {
    return text.replace(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/g,
      function (_, month, date) {
        return date + '\u00a0' + (MONTHS[month] || month.toLowerCase());
      }
    );
  }

  function translateWeekLabel(text) {
    return text.replace(/Week\s+of\s+(\w+)\s+(\d+),?\s*(\d{4})?/gi, function (_, month, date, year) {
      var fr = MONTHS[month] || month.toLowerCase();
      return year ? 'Semaine du ' + date + ' ' + fr + ' ' + year
                  : 'Semaine du ' + date + ' ' + fr;
    });
  }

  function translateStr(text) {
    text = translateWeekLabel(text);
    text = flipDate(text);
    Object.keys(HOLIDAYS).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
      text = text.replace(new RegExp(k, 'g'), HOLIDAYS[k]);
    });
    Object.keys(PHRASES).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
      text = text.replace(new RegExp('\\b' + k + '\\b', 'g'), PHRASES[k]);
    });
    Object.keys(DAYS).forEach(function (en) {
      text = text.replace(new RegExp('\\b' + en + '\\b', 'g'), DAYS[en]);
    });
    text = toFrenchTime(text);
    return text;
  }

  // ── Desktop French: translate in place ───────────────────────────────────

  function translateWidget(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var t = translateStr(node.textContent);
      if (t !== node.textContent) node.textContent = t;
    }
    root.querySelectorAll('[aria-label]').forEach(function (el) {
      var t = translateStr(el.getAttribute('aria-label'));
      if (t !== el.getAttribute('aria-label')) el.setAttribute('aria-label', t);
    });
    root.querySelectorAll('[title]').forEach(function (el) {
      var t = translateStr(el.getAttribute('title'));
      if (t !== el.getAttribute('title')) el.setAttribute('title', t);
    });
  }

  function setupDesktopFrench(widget) {
    translateWidget(widget);
    var debounceTimer;
    var obs = new MutationObserver(function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () { translateWidget(widget); }, 80);
    });
    obs.observe(widget, { childList: true, subtree: true });
  }

  // ── Mobile: parse table ───────────────────────────────────────────────────

  function parseTable(table) {
    var headers = table.querySelectorAll('thead th:not(:first-child)');
    var days = Array.from(headers).map(function (th) {
      var dateSpan = th.querySelector('.s-lc-whw-head-date');
      if (!dateSpan) return null;
      var dateText = dateSpan.innerHTML.trim().replace(/<br\s*\/?>/i, ' ');
      var parts    = dateText.split(/\s+/);
      var month    = parts[0];
      var date     = parseInt(parts[1], 10);
      var dayName  = th.innerText.replace(dateSpan.innerText, '').trim().split('\n').pop().trim();
      return { day: dayName, month: month, date: date };
    }).filter(Boolean);

    var entries = [];
    table.querySelectorAll('tbody tr').forEach(function (row) {
      row.querySelectorAll('td:not(:first-child)').forEach(function (cell, i) {
        entries.push({
          day      : days[i] ? days[i].day   : 'Unknown',
          month    : days[i] ? days[i].month : 'Unknown',
          date     : days[i] ? days[i].date  : 0,
          timeText : cell.innerText.trim()
        });
      });
    });
    return entries;
  }

  // ── Mobile: render list ───────────────────────────────────────────────────

  function buildMobileList(entries, container) {
    container.innerHTML = '';
    entries.forEach(function (entry) {
      var item = document.createElement('div');
      item.style.cssText = 'display:flex;justify-content:space-between;padding:5px 0;';

      var left  = document.createElement('span');
      var right = document.createElement('span');
      left.style.fontWeight = 'bold';
      right.style.textAlign = 'right';

      if (isFrench) {
        var dayFr   = DAYS_FULL[entry.day]  || entry.day.toLowerCase();
        var monthFr = MONTHS[entry.month]   || entry.month.toLowerCase();
        left.textContent  = 'Le ' + dayFr + ' ' + entry.date + ' ' + monthFr;
        right.textContent = translateStr(entry.timeText);
      } else {
        left.textContent  = entry.day + ', ' + entry.month + ' ' + entry.date;
        right.textContent = entry.timeText;
      }

      item.appendChild(left);
      item.appendChild(right);
      container.appendChild(item);
    });
  }

  // ── Mobile: setup ─────────────────────────────────────────────────────────

  function setupMobile(widget) {
    var table = widget.querySelector('.s-lc-whw');
    if (!table) return;

    widget.style.position = 'absolute';
    widget.style.left     = '-9999px';

    var nav = document.createElement('div');
    nav.className = 'd-flex justify-content-between mb-3';

    var prevBtn = document.createElement('button');
    var nextBtn = document.createElement('button');
    prevBtn.className = 'btn btn-outline-secondary btn-sm';
    nextBtn.className = 'btn btn-outline-secondary btn-sm';
    prevBtn.textContent = isFrench ? '« Précédent' : '« Previous';
    nextBtn.textContent = isFrench ? 'Suivant »'   : 'Next »';

    function navigate(dir) {
      var btn = document.querySelector('#s-lc-whw-' + dir + '-' + lid);
      if (!btn) return;
      var date = jQuery(btn).data('date');
      if (!date) return;
      var baseScript = document.querySelector('script[src*="hours_grid.js"]');
      if (!baseScript) return;
      var a = document.createElement('a');
      a.href = baseScript.src;
      jQuery.ajax({
        type: 'get', dataType: 'html', cache: true,
        url: 'https://' + a.hostname + '/widget/hours/grid?iid=' + IID + '&lid=' + lid + '&date=' + date
      }).done(function (v) {
        jQuery(widget).html(v);
      });
    }

    prevBtn.addEventListener('click', function () { navigate('prev'); });
    nextBtn.addEventListener('click', function () { navigate('next'); });

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);

    var listContainer = document.createElement('div');
    buildMobileList(parseTable(table), listContainer);

    widget.parentNode.insertBefore(nav, widget.nextSibling);
    widget.parentNode.insertBefore(listContainer, nav.nextSibling);

    var debounceTimer;
    var obs = new MutationObserver(function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var newTable = widget.querySelector('.s-lc-whw');
        if (newTable && newTable.querySelector('tbody tr')) {
          buildMobileList(parseTable(newTable), listContainer);
        }
      }, 100);
    });
    obs.observe(widget, { childList: true, subtree: true });
  }

  // ── Widget init ───────────────────────────────────────────────────────────

  var divId = 's-lc-whw' + lid;

  function setupTranslation() {
    var widget = document.querySelector('[id^="s-lc-whw"]');
    if (!widget || !widget.querySelector('.s-lc-whw')) {
      setTimeout(setupTranslation, 100);
      return;
    }
    if (isMobile) {
      setupMobile(widget);
    } else if (isFrench) {
      setupDesktopFrench(widget);
    }
  }

  function initWidget() {
   // console.log("function initWidget ran")
    if (typeof jQuery === 'undefined') {
     // console.log('initWidget: waiting for jQuery');
      setTimeout(initWidget, 50);
      return;
    }
    // Create widget div if not already present
  var el = document.getElementById('wpl-hours-widget');
  if (el) {
    el.id = divId;
   // console.log('initWidget: renamed existing div to', divId);
  } else if (!document.getElementById(divId)) {
    el = document.createElement('div');
    el.id = divId;
if (CURRENT_SCRIPT) {
  CURRENT_SCRIPT.parentNode.insertBefore(el, CURRENT_SCRIPT);
} else {
  document.body.appendChild(el);
}
   // console.log('initWidget: created new div', divId);
  } else {
   // console.log('initWidget: div already exists', divId);
  }

  if (!document.querySelector('script[src*="hours_grid.js"]')) {
   // console.log('initWidget: loading hours_grid.js');
  }
    // Load hours_grid.js dynamically so it runs after jQuery is ready
    if (!document.querySelector('script[src*="hours_grid.js"]')) {
      var s = document.createElement('script');
      s.src = 'https://wpl.libcal.com/js/hours_grid.js?002';
      s.onload = function () {
        new jQuery.LibCalWeeklyGrid(jQuery('#' + divId), { iid: IID, lid: lid, systemTime: false });
        setupTranslation();
      };
      document.head.appendChild(s);
    } else if (typeof jQuery.LibCalWeeklyGrid !== 'undefined') {
      new jQuery.LibCalWeeklyGrid(jQuery('#' + divId), { iid: IID, lid: lid, systemTime: false });
      setupTranslation();
    } else {
      setTimeout(initWidget, 50);
    }
  }

  initWidget();

})();
