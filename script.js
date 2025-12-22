let data = [];
const list = document.getElementById("laptopList");
const count = document.getElementById("resultCount");
const checks = document.querySelectorAll("input[type=checkbox]");
const reset = document.getElementById("resetAll");

/* Read a CSV line and correctly handle values that are inside quotes */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/* Load CSV */
fetch("Final data.csv")
  .then(r => r.text())
  .then(t => {
    const lines = t.trim().replace(/\r/g, '').split("\n");
    const headers = parseCSVLine(lines[0]);
    data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i] || '']));
    });
    filter();
  });

checks.forEach(c => c.onchange = filter);
reset.onclick = () => {
  checks.forEach(c => c.checked = false);
  filter();
};

function get(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(c => c.value);
}

function extractNumber(str) {
  const match = String(str).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function filter() {
  let r = [...data];



  // Job Category filter - match texts
  const usage = get("usage");
  if (usage.length) {
    r = r.filter(l => {
      const cat = (l.JobCategory || '').toLowerCase();
      return usage.some(v => cat.includes(v.toLowerCase().split('(')[0].trim()));
    });
  }

  // CPU filter
  const cpu = get("cpu");
  if (cpu.length) {
    r = r.filter(l => {
      const laptopCPU = (l.CPU || '').toLowerCase();
      return cpu.some(v => laptopCPU.includes(v.toLowerCase()));
    });
  }

  // RAM filter (minimum GB)
  const ram = get("ram");
  if (ram.length) {
    r = r.filter(l => {
      const ramGB = extractNumber(l.RAM);
      return ram.some(v => ramGB >= +v);
    });
  }

  // Storage filter (minimum GB)
  const storage = get("storage");
  if (storage.length) {
    r = r.filter(l => {
      const storageGB = extractNumber(l.Storage);
      return storage.some(v => storageGB >= +v);
    });
  }

  // Price Range filter
  const priceRange = get("priceRange");
  if (priceRange.length) {
    r = r.filter(l => {
      const range = (l.PriceRange || '').toLowerCase().trim();
      return priceRange.some(v => range.includes(v.toLowerCase()));
    });
  }

  // Price filter
  const price = get("price");
  if (price.length && !price.includes("0")) {
    r = r.filter(l => {
      const priceILS = extractNumber(l.Price_ILS_Estimated);
      return price.some(v => priceILS >= +v);
    });
  }

  // Battery filter
  const battery = get("battery");
  if (battery.length) {
    r = r.filter(l => {
      const hours = extractNumber(l.BatteryEstimate);
      return battery.some(v => {
        if (v === 'short') return hours > 0 && hours < 6;
        if (v === 'medium') return hours >= 6 && hours < 10;
        if (v === 'long') return hours >= 10;
        if (v === 'excellent') return hours >= 12;
        return false;
      });
    });
  }

  // Display filter
  const display = get("display");
  if (display.length) {
    r = r.filter(l => {
      const size = parseFloat(String(l.Display).match(/(\d+\.?\d*)/)?.[1] || 0);
      return display.some(v => {
        const min = +v;
        if (min === 12) return size >= 12 && size < 14;
        if (min === 14) return size >= 14 && size < 15;
        if (min === 15) return size >= 15 && size < 17;
        return size >= 17;
      });
    });
  }

  render(r);
}

function render(arr) {
  list.innerHTML = "";
  count.textContent = `${arr.length} laptop(s) found`;

  arr.forEach(l => {
    const title = `${l.Brand || ''} ${l.Model || ''}`.trim();
    const buyUrl = l.URL || '';
    const reviewUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' review')}`;
    
    list.innerHTML += `
      <div class="card">
        <h3>${title}</h3>
        <p class="meta">${l.JobCategory || ''}</p>
        <p>${l.CPU || 'N/A'} • ${l.RAM || 'N/A'} RAM • ${l.Storage || 'N/A'}</p>
        <p style="font-weight:600;color:#0f969C">${l.Price_ILS_Estimated || ''} ILS</p>

        <div class="actions">
          ${buyUrl ? `<a class="view-details-btn" href="${buyUrl}" target="_blank">🛒 Buy</a>` : ''}
          <a class="view-details-btn" style="background:rgba(0,204,204,1)" href="${reviewUrl}" target="_blank">▶ Reviews</a>
        </div>
      </div>`;
  });
}
