/* همسانی موتور تطبیق PHP (aio_match_cv) و JS (match.js) روی داده‌ی واقعی سایت — بدون مرورگر */
const { wp, check, done } = require("./lib");
const fs = require("fs"), vm = require("vm"), path = require("path");
const out = JSON.parse(wp(`$d = aio_data(); $admin = (int) (get_users(["role"=>"administrator","number"=>1,"fields"=>"ID"])[0] ?? 1);
$c = []; foreach (get_users(["meta_key"=>"aio_cv","meta_compare"=>"EXISTS","fields"=>"ID","number"=>1000]) as $u) { $x = aio_talent_candidate((int)$u); if ($x) $c[] = $x; }
$p = aio_talent_positions($admin); $s = [];
foreach ($c as $x) foreach ($p as $j) $s[$x["id"].":".$j["id"]] = aio_match_cv($x, $j)["score"];
echo json_encode(["d"=>array_intersect_key($d, array_flip(["AIO_SKILLS","AIO_SKILL_LEVELS","AIO_DEGREE_LEVELS","AIO_LICENSES","AIO_LANGUAGES","AIO_MATCH_WEIGHTS","AIO_SENIORITY","AIO_LANG_LEVELS"])), "c"=>$c, "p"=>$p, "s"=>$s], JSON_UNESCAPED_UNICODE);`));
const ctx = Object.assign({}, out.d); vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../../assets/js/match.js"), "utf8") + ";globalThis.AioMatch = AioMatch;", ctx);
let n = 0; const bad = [];
out.c.forEach(c => out.p.forEach(j => { const k = c.id + ":" + j.id, js = ctx.AioMatch.score(c, j).score; n++; if (js !== out.s[k]) bad.push(`${k} js=${js} php=${out.s[k]}`); }));
check(n > 0 && !bad.length, `موتور PHP و JS روی ${out.c.length} رزومه × ${out.p.length} پوزیشن (${n} زوج) یکسان است` + (bad.length ? " — " + bad.slice(0, 5).join(", ") : ""));
done();
