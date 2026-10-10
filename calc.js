// 頒布の損益計算機。外部への通信・保存は一切しない。
(function () {
  "use strict";

  // BOOTHの商品URL（公開後に設定する。空の間はボタンを無効表示にする）
  var LINKS = { "link-lite": "", "link-full": "" };

  var ids = ["price", "qty", "cost", "fee", "travel", "other", "sold"];
  var yen = function (n) { return (n < 0 ? "−" : "") + Math.abs(Math.round(n)).toLocaleString("ja-JP") + "円"; };
  var num = function (id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; };

  function setMoney(id, v) {
    var el = document.getElementById(id);
    el.textContent = yen(v);
    el.className = v < 0 ? "neg" : (v > 0 ? "pos" : "");
  }

  // 計算本体（テストしやすいよう純粋関数にしてある）
  function compute(p) {
    var total = p.cost + p.fee + p.travel + p.other;
    var sold = Math.min(p.sold, p.qty);
    return {
      unit: p.qty > 0 ? p.cost / p.qty : null,
      total: total,
      breakEven: p.price > 0 ? Math.ceil(total / p.price) : null,
      expected: p.price * sold - total,
      stock: p.qty - sold,
      full: p.price * p.qty - total,
      soldCapped: p.sold > p.qty
    };
  }

  function render() {
    var p = {};
    ids.forEach(function (id) { p[id === "qty" ? "qty" : id] = num(id); });
    var r = compute(p);
    document.getElementById("r-unit").textContent = r.unit === null ? "–" : yen(r.unit);
    document.getElementById("r-total").textContent = yen(r.total);
    document.getElementById("r-be").textContent = r.breakEven === null ? "–" : r.breakEven.toLocaleString("ja-JP") + "部";
    setMoney("r-exp", r.expected);
    document.getElementById("r-stock").textContent = r.stock.toLocaleString("ja-JP") + "部";
    setMoney("r-full", r.full);

    var warn = document.getElementById("warn");
    var msgs = [];
    if (r.breakEven !== null && r.breakEven > p.qty) msgs.push("損益分岐部数が制作部数を超えています。完売しても赤字になります。");
    if (r.soldCapped) msgs.push("見込み頒布数が制作部数を超えているため、制作部数までで計算しています。");
    warn.hidden = msgs.length === 0;
    warn.textContent = msgs.join(" ");

    var tbody = document.getElementById("r-table");
    tbody.textContent = "";
    if (p.price > 0) {
      var step = p.price >= 1000 ? 100 : 50;
      for (var k = -3; k <= 3; k++) {
        var price = p.price + k * step;
        if (price <= 0) continue;
        var q = compute({ price: price, qty: p.qty, cost: p.cost, fee: p.fee, travel: p.travel, other: p.other, sold: p.sold });
        var tr = document.createElement("tr");
        if (k === 0) tr.className = "current";
        [yen(price), q.breakEven.toLocaleString("ja-JP") + "部", yen(q.expected), yen(q.full)].forEach(function (t, i) {
          var td = document.createElement("td");
          td.textContent = t;
          if (i >= 2) td.className = (i === 2 ? q.expected : q.full) < 0 ? "neg" : "";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
    }
  }

  Object.keys(LINKS).forEach(function (id) {
    var a = document.getElementById(id);
    if (!a) return;
    if (LINKS[id]) { a.href = LINKS[id]; a.rel = "noopener"; }
    else { a.classList.add("disabled"); a.setAttribute("aria-disabled", "true"); a.textContent += "（準備中）"; }
  });
  ids.forEach(function (id) { document.getElementById(id).addEventListener("input", render); });
  window.dtoolsCompute = compute;
  render();
})();
