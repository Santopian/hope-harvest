const OFFERING_LABELS = {
  produce: { en: "Fresh produce", es: "Frutas y verduras" },
  protein: { en: "Protein", es: "Proteína" },
  dairy: { en: "Dairy", es: "Lácteos" },
  grains: { en: "Grains", es: "Granos" },
  canned: { en: "Canned foods", es: "Enlatados" },
  baby: { en: "Baby items", es: "Artículos para bebé" },
  diapers: { en: "Diapers", es: "Pañales" },
  hygiene: { en: "Hygiene", es: "Higiene" },
  hot_meal: { en: "Hot meals", es: "Comida caliente" }
};

const DEFAULT_ZIP_CENTROIDS = {
  "78501": { lat: 26.207, lng: -98.23 },
  "78503": { lat: 26.175, lng: -98.248 },
  "78504": { lat: 26.265, lng: -98.248 },
  "78539": { lat: 26.294, lng: -98.159 },
  "78541": { lat: 26.305, lng: -98.163 },
  "78572": { lat: 26.217, lng: -98.325 },
  "78573": { lat: 26.191, lng: -98.317 },
  "78577": { lat: 26.194, lng: -98.183 },
  "78596": { lat: 26.159, lng: -97.988 },
  "78599": { lat: 26.158, lng: -97.99 },
  "78550": { lat: 26.191, lng: -97.696 },
  "78552": { lat: 26.19, lng: -97.725 },
  "78520": { lat: 25.901, lng: -97.497 },
  "78521": { lat: 25.926, lng: -97.418 },
  "78526": { lat: 25.965, lng: -97.552 }
};

const API_BASE = "";

function getStoredAdminToken() {
  try {
    return localStorage.getItem("adminToken") || "";
  } catch {
    return "";
  }
}

function setStoredAdminToken(token) {
  try {
    const trimmed = String(token || "").trim();
    if (!trimmed) localStorage.removeItem("adminToken");
    else localStorage.setItem("adminToken", trimmed);
  } catch {
    return;
  }
}

const EMPTY_LIST = [];

const INGREDIENTS = [
  { key: "beans", label: { en: "Beans", es: "Frijoles" } },
  { key: "rice", label: { en: "Rice", es: "Arroz" } },
  { key: "tortillas", label: { en: "Tortillas", es: "Tortillas" } },
  { key: "bread", label: { en: "Bread", es: "Pan" } },
  { key: "eggs", label: { en: "Eggs", es: "Huevos" } },
  { key: "cheese", label: { en: "Cheese", es: "Queso" } },
  { key: "oats", label: { en: "Oats", es: "Avena" } },
  { key: "pasta", label: { en: "Pasta", es: "Pasta" } },
  { key: "ramen", label: { en: "Ramen", es: "Ramen" } },
  { key: "lentils", label: { en: "Lentils", es: "Lentejas" } },
  { key: "canned_tuna", label: { en: "Canned tuna", es: "Atún enlatado" } },
  { key: "canned_chicken", label: { en: "Canned chicken", es: "Pollo enlatado" } },
  { key: "canned_chickpeas", label: { en: "Chickpeas", es: "Garbanzos" } },
  { key: "canned_corn", label: { en: "Canned corn", es: "Elote enlatado" } },
  { key: "canned_tomato_sauce", label: { en: "Tomato sauce", es: "Salsa de tomate" } },
  { key: "salsa", label: { en: "Salsa", es: "Salsa" } },
  { key: "cereal", label: { en: "Cereal", es: "Cereal" } },
  { key: "milk", label: { en: "Milk", es: "Leche" } },
  { key: "yogurt", label: { en: "Yogurt", es: "Yogur" } },
  { key: "peanut_butter", label: { en: "Peanut butter", es: "Mantequilla de cacahuate" } },
  { key: "frozen_veg", label: { en: "Frozen vegetables", es: "Verduras congeladas" } },
  { key: "onion", label: { en: "Onion", es: "Cebolla" } },
  { key: "garlic", label: { en: "Garlic", es: "Ajo" } },
  { key: "banana", label: { en: "Banana", es: "Plátano" } },
  { key: "apple", label: { en: "Apple", es: "Manzana" } },
  { key: "broth_or_water", label: { en: "Broth or water", es: "Caldo o agua" } }
];

function haversineMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function formatOffering(tag, lang) {
  return OFFERING_LABELS[tag]?.[lang] ?? tag;
}

function getHashRoute() {
  const raw = window.location.hash.replace(/^#/, "");
  const [pathPart, queryPart] = raw.split("?");
  const path = pathPart || "/";
  const query = new URLSearchParams(queryPart || "");
  return { path, query };
}

function navigate(to) {
  window.location.hash = to.startsWith("#") ? to : `#${to}`;
}

function useHashRoute() {
  const [route, setRoute] = React.useState(getHashRoute());
  React.useEffect(() => {
    const onChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function filterPantries({ pantries, zip, selectedOfferings }) {
  const zipCentroid = DEFAULT_ZIP_CENTROIDS[zip];
  const hasZip = Boolean(zipCentroid);

  const list = (pantries || []).filter((p) => {
    if (!p.zip) return false;
    for (const off of selectedOfferings) {
      if (!p.offerings?.includes(off)) return false;
    }
    return true;
  }).map((p) => {
    let distance = null;
    if (hasZip && p.lat != null && p.lng != null) {
      distance = haversineMiles(zipCentroid, { lat: p.lat, lng: p.lng });
    }
    return { ...p, distance };
  });

  list.sort((a, b) => {
    if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });

  return { list, zipCentroidFound: hasZip };
}

function matchRecipes(recipes, selected) {
  const selectedSet = new Set(selected);
  const matches = [];
  for (const r of recipes || EMPTY_LIST) {
    const ok = r.required.every((k) => selectedSet.has(k));
    if (!ok) continue;
    const optionalHits = (r.optional || []).filter((k) => selectedSet.has(k)).length;
    matches.push({ recipe: r, optionalHits });
  }
  matches.sort((a, b) => b.optionalHits - a.optionalHits);
  return matches.slice(0, 5);
}

function Toggle({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={pressed ? "btnPrimary" : ""}
    >
      {children}
    </button>
  );
}

function App() {
  const { path, query } = useHashRoute();
  const [lang, setLang] = React.useState("en");
  const [theme, setTheme] = React.useState("dark");
  const [contrast, setContrast] = React.useState("normal");
  const [bigText, setBigText] = React.useState(false);
  const [pantries, setPantries] = React.useState([]);
  const [pantriesStatus, setPantriesStatus] = React.useState("loading");
  const [recipes, setRecipes] = React.useState([]);
  const [recipesStatus, setRecipesStatus] = React.useState("loading");

  const reloadPantries = React.useCallback(async () => {
    try {
      setPantriesStatus("loading");
      const res = await fetch(`${API_BASE}/api/pantries`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPantries(Array.isArray(data) ? data : []);
      setPantriesStatus("ready");
    } catch {
      setPantries([]);
      setPantriesStatus("error");
    }
  }, []);

  const reloadRecipes = React.useCallback(async () => {
    try {
      setRecipesStatus("loading");
      const res = await fetch(`${API_BASE}/api/recipes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
      setRecipesStatus("ready");
    } catch {
      setRecipes([]);
      setRecipesStatus("error");
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
    document.documentElement.setAttribute(
      "data-contrast",
      contrast === "high" ? "high" : "normal"
    );
    document.documentElement.style.fontSize = bigText ? "18px" : "16px";
  }, [theme, contrast, bigText]);

  React.useEffect(() => {
    reloadPantries();
  }, [reloadPantries]);

  React.useEffect(() => {
    reloadRecipes();
  }, [reloadRecipes]);

  const header = (
    <header>
      <div className="brand">
        <img className="brandLogo" src="./assets/hope_harvest_logo.png" alt="Hope Harvest" />
        <h1>Hope Harvest</h1>
        <p>{lang === "es" ? "Encuentra despensas y qué cocinar" : "Find pantries and what to cook"}</p>
      </div>
      <div className="toolbar">
        <span className="pill" aria-label="language">
          {lang === "es" ? "Idioma" : "Language"}:&nbsp;
          <button type="button" onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}>
            {lang === "en" ? "English" : "Español"}
          </button>
        </span>
        <Toggle pressed={theme === "light"} onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {lang === "es" ? "Claro" : "Light"}
        </Toggle>
        <Toggle pressed={contrast === "high"} onClick={() => setContrast((c) => (c === "normal" ? "high" : "normal"))}>
          {lang === "es" ? "Alto contraste" : "High contrast"}
        </Toggle>
        <Toggle pressed={bigText} onClick={() => setBigText((v) => !v)}>
          {lang === "es" ? "Texto grande" : "Large text"}
        </Toggle>
      </div>
    </header>
  );

  let page = null;

  if (path === "/" || path === "") {
    page = <SearchPage lang={lang} pantries={pantries} pantriesStatus={pantriesStatus} />;
  } else if (path.startsWith("/pantry/")) {
    const id = path.replace("/pantry/", "");
    page = <PantryPage lang={lang} pantryId={id} pantries={pantries} pantriesStatus={pantriesStatus} />;
  } else if (path === "/cook") {
    page = (
      <CookPage
        lang={lang}
        pantryId={query.get("pantry") || ""}
        pantries={pantries}
        pantriesStatus={pantriesStatus}
        recipes={recipes}
        recipesStatus={recipesStatus}
      />
    );
  } else if (path === "/admin") {
    page = (
      <AdminPage
        lang={lang}
        pantries={pantries}
        pantriesStatus={pantriesStatus}
        onChanged={reloadPantries}
      />
    );
  } else {
    page = (
      <div className="panel">
        <p style={{ margin: 0 }}>{lang === "es" ? "Página no encontrada." : "Page not found."}</p>
        <div className="actions">
          <button className="btnPrimary" onClick={() => navigate("/")}>Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {header}
      {page}
      <div className="footer">
        {lang === "es"
          ? "Nota: Ofertas y horarios pueden cambiar. Llama antes de ir."
          : "Note: Offerings and hours can change. Call before you go."}
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={() => navigate("/admin")}>
            {lang === "es" ? "Admin" : "Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchPage({ lang, pantries, pantriesStatus }) {
  const [zip, setZip] = React.useState("78577");
  const [selectedOfferings, setSelectedOfferings] = React.useState([]);

  const { list, zipCentroidFound } = React.useMemo(
    () => filterPantries({ pantries, zip, selectedOfferings }),
    [pantries, zip, selectedOfferings]
  );

  const offeringKeys = Object.keys(OFFERING_LABELS);

  return (
    <div className="panel" role="main">
      <div className="row">
        <div className="col">
          <label htmlFor="zip">{lang === "es" ? "Código postal" : "ZIP code"}</label>
          <input
            id="zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder={lang === "es" ? "Ej. 78577" : "e.g. 78577"}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
          />
          <p className="hint" style={{ marginTop: 8 }}>
            {zipCentroidFound
              ? lang === "es"
                ? "Ordenado por distancia aproximada."
                : "Sorted by approximate distance."
              : lang === "es"
                ? "ZIP no está en la lista demo; mostrando por nombre."
                : "ZIP not in demo list; sorting by name."}
          </p>
        </div>
        <div className="col">
          <label>{lang === "es" ? "Filtrar por lo que ofrecen" : "Filter by offerings"}</label>
          <div className="tags" role="group" aria-label="offerings filters">
            {offeringKeys.map((k) => {
              const on = selectedOfferings.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  className={on ? "tag tagOn" : "tag"}
                  onClick={() =>
                    setSelectedOfferings((prev) =>
                      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                    )
                  }
                >
                  {formatOffering(k, lang)}
                </button>
              );
            })}
          </div>
          <div className="actions">
            <button className="btnDanger" type="button" onClick={() => setSelectedOfferings([])}>
              {lang === "es" ? "Limpiar filtros" : "Clear filters"}
            </button>
          </div>
        </div>
      </div>

      <div className="divider" />

      <p className="hint" style={{ margin: "0 0 10px" }}>
        {lang === "es" ? `Resultados (${list.length})` : `Results (${list.length})`}
      </p>

      {pantriesStatus === "loading" ? (
        <p className="hint" style={{ margin: "0 0 10px" }}>
          {lang === "es" ? "Cargando despensas..." : "Loading pantries..."}
        </p>
      ) : null}

      {pantriesStatus === "error" ? (
        <p className="hint" style={{ margin: "0 0 10px" }}>
          {lang === "es"
            ? "No se pudo cargar la base de datos. Inicia el servidor Node."
            : "Could not load the database. Start the Node server."}
        </p>
      ) : null}

      <div className="grid" aria-live="polite">
        {list.map((p) => (
          <div key={p.id} className="card">
            <h3>{p.name}</h3>
            <p className="meta">
              {p.address1 ? `${p.address1}, ` : ""}
              {p.city}, {p.state} {p.zip}
              {p.distance != null ? ` • ${p.distance.toFixed(1)} mi` : ""}
            </p>
            <div className="tags">
              {(p.offerings || []).slice(0, 6).map((t) => (
                <span key={t} className="tag">{formatOffering(t, lang)}</span>
              ))}
            </div>
            <div className="actions">
              <button className="btnPrimary" onClick={() => navigate(`/pantry/${p.id}`)}>
                {lang === "es" ? "Ver" : "View"}
              </button>
              <button onClick={() => navigate(`/cook?pantry=${encodeURIComponent(p.id)}`)}>
                {lang === "es" ? "Qué cocinar" : "What to cook"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="hint" style={{ marginTop: 12 }}>
          {lang === "es" ? "No hay resultados con esos filtros." : "No results with those filters."}
        </p>
      ) : null}
    </div>
  );
}

function PantryPage({ lang, pantryId, pantries, pantriesStatus }) {
  const pantry = (pantries || []).find((p) => p.id === pantryId);

  if (!pantry) {
    return (
      <div className="panel" role="main">
        <p style={{ margin: 0 }}>
          {pantriesStatus === "loading"
            ? lang === "es"
              ? "Cargando..."
              : "Loading..."
            : lang === "es"
              ? "Despensa no encontrada."
              : "Pantry not found."}
        </p>
        <div className="actions">
          <button className="btnPrimary" onClick={() => navigate("/")}>Home</button>
        </div>
      </div>
    );
  }

  const addr = `${pantry.address1}, ${pantry.city}, ${pantry.state} ${pantry.zip}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  const telUrl = pantry.phone ? `tel:${pantry.phone.replace(/[^0-9+]/g, "")}` : null;

  return (
    <div className="panel" role="main">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <button onClick={() => navigate("/")}>{lang === "es" ? "← Buscar" : "← Search"}</button>
        <button className="btnPrimary" onClick={() => navigate(`/cook?pantry=${encodeURIComponent(pantry.id)}`)}>
          {lang === "es" ? "Qué cocinar" : "What to cook"}
        </button>
      </div>

      <h2 style={{ margin: "8px 0 6px" }}>{pantry.name}</h2>
      <p className="meta" style={{ marginTop: 0 }}>{addr}</p>

      <div className="twoCol">
        <div className="panel" style={{ padding: 12 }}>
          <p className="hint" style={{ margin: "0 0 6px" }}>{lang === "es" ? "Horarios" : "Hours"}</p>
          <p style={{ margin: 0 }}>{pantry.hoursText || (lang === "es" ? "(No disponible)" : "(Not provided)")}</p>

          <div className="divider" />

          <p className="hint" style={{ margin: "0 0 6px" }}>{lang === "es" ? "Elegibilidad" : "Eligibility"}</p>
          <p style={{ margin: 0 }}>{pantry.eligibilityText || (lang === "es" ? "(No disponible)" : "(Not provided)")}</p>

          {pantry.notes ? (
            <>
              <div className="divider" />
              <p className="hint" style={{ margin: "0 0 6px" }}>{lang === "es" ? "Notas" : "Notes"}</p>
              <p style={{ margin: 0 }}>{pantry.notes}</p>
            </>
          ) : null}
        </div>

        <div className="panel" style={{ padding: 12 }}>
          <p className="hint" style={{ margin: "0 0 8px" }}>{lang === "es" ? "Lo que ofrecen" : "What they offer"}</p>
          <div className="tags">
            {(pantry.offerings || []).map((t) => (
              <span key={t} className="tag tagOn">{formatOffering(t, lang)}</span>
            ))}
          </div>

          {Array.isArray(pantry.availableIngredients) && pantry.availableIngredients.length ? (
            <>
              <div className="divider" />
              <p className="hint" style={{ margin: "0 0 8px" }}>
                {lang === "es" ? "Ingredientes disponibles" : "Available ingredients"}
              </p>
              <div className="tags">
                {pantry.availableIngredients.map((k) => (
                  <span key={k} className="tag">{INGREDIENTS.find((i) => i.key === k)?.label?.[lang] || k}</span>
                ))}
              </div>
            </>
          ) : null}

          <div className="divider" />

          <div className="actions">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <button className="btnPrimary" type="button">{lang === "es" ? "Direcciones" : "Directions"}</button>
            </a>
            {telUrl ? (
              <a href={telUrl}><button type="button">{lang === "es" ? "Llamar" : "Call"}</button></a>
            ) : (
              <button type="button" disabled>{lang === "es" ? "Teléfono no disponible" : "No phone listed"}</button>
            )}
            {pantry.website ? (
              <a href={pantry.website} target="_blank" rel="noreferrer"><button type="button">{lang === "es" ? "Sitio" : "Website"}</button></a>
            ) : null}
          </div>

          <p className="hint" style={{ margin: "10px 0 0" }}>
            {lang === "es" ? `Verificado: ${pantry.lastVerified || ""}` : `Last verified: ${pantry.lastVerified || ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function CookPage({ lang, pantryId, pantries, recipes, recipesStatus }) {
  const pantry = (pantries || []).find((p) => p.id === pantryId);
  const [selected, setSelected] = React.useState(() => new Set(["broth_or_water"]));

  const pantrySuggestedIngredients = React.useMemo(() => {
    const list = Array.isArray(pantry?.availableIngredients) ? pantry.availableIngredients : [];
    return new Set(list);
  }, [pantry?.availableIngredients]);

  React.useEffect(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of pantrySuggestedIngredients) next.add(k);
      return next;
    });
  }, [pantrySuggestedIngredients]);

  const selectedArr = Array.from(selected);
  const matches = React.useMemo(
    () => matchRecipes(recipes, selectedArr),
    [recipes, selectedArr]
  );

  function toggleIngredient(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="panel" role="main">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <button onClick={() => (pantry ? navigate(`/pantry/${pantry.id}`) : navigate("/"))}>
          {lang === "es" ? "← Regresar" : "← Back"}
        </button>
        <button className="btnDanger" onClick={() => setSelected(new Set(["broth_or_water"]))}>
          {lang === "es" ? "Reiniciar" : "Reset"}
        </button>
      </div>

      <h2 style={{ margin: "8px 0 6px" }}>{lang === "es" ? "Qué puedo cocinar" : "What can I cook"}</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        {pantry
          ? lang === "es" ? `Basado en: ${pantry.name}` : `Based on: ${pantry.name}`
          : lang === "es" ? "Selecciona ingredientes comunes." : "Select common ingredients."}
      </p>

      <div className="divider" />

      <div className="twoCol">
        <div>
          <p className="hint" style={{ margin: "0 0 10px" }}>
            {lang === "es" ? "Marca lo que tienes o puedes conseguir." : "Check what you have or can get."}
          </p>
          <div className="checklist">
            {INGREDIENTS.map((it) => {
              const on = selected.has(it.key);
              return (
                <label key={it.key} className="check">
                  <input type="checkbox" checked={on} onChange={() => toggleIngredient(it.key)} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.label[lang] || it.key}</div>
                    {pantrySuggestedIngredients.has(it.key) ? (
                      <div className="hint" style={{ marginTop: 2 }}>
                        {lang === "es" ? "Sugerido por esta despensa" : "Suggested by this pantry"}
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <p className="hint" style={{ margin: "0 0 10px" }}>{lang === "es" ? "Ideas (máx. 5)" : "Ideas (max 5)"}</p>
          {recipesStatus === "loading" ? (
            <p className="hint" style={{ margin: "0 0 10px" }}>
              {lang === "es" ? "Cargando recetas..." : "Loading recipes..."}
            </p>
          ) : null}
          {recipesStatus === "error" ? (
            <p className="hint" style={{ margin: "0 0 10px" }}>
              {lang === "es" ? "No se pudieron cargar las recetas." : "Could not load recipes."}
            </p>
          ) : null}
          {matches.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0 }}>
                {lang === "es"
                  ? "No hay recetas que coincidan aún. Marca más ingredientes (por ejemplo, arroz o frijoles)."
                  : "No matches yet. Check more ingredients (like rice or beans)."}
              </p>
            </div>
          ) : (
            <div className="grid">
              {matches.map(({ recipe, optionalHits }) => (
                <div key={recipe.id} className="card">
                  <h3>{recipe.title}</h3>
                  <p className="meta">
                    {(lang === "es" ? "Tiempo" : "Time") + ": " + recipe.timeMins + " min"} • {"Extras: " + optionalHits}
                  </p>
                  <p className="hint" style={{ margin: "0 0 6px" }}>
                    {lang === "es" ? "Requiere" : "Requires"}: {recipe.required.join(", ")}
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 18 }}>
                    {recipe.steps.map((s, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPage({ lang, pantries, pantriesStatus, onChanged }) {
  const [adminConfigured, setAdminConfigured] = React.useState(null);
  const [token, setToken] = React.useState(getStoredAdminToken());
  const [tokenStatus, setTokenStatus] = React.useState("unknown");
  const [error, setError] = React.useState("");

  const [id, setId] = React.useState("");
  const [name, setName] = React.useState("");
  const [address1, setAddress1] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("TX");
  const [zip, setZip] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [hoursText, setHoursText] = React.useState("");
  const [eligibilityText, setEligibilityText] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [lastVerified, setLastVerified] = React.useState("");
  const [offerings, setOfferings] = React.useState(() => new Set());
  const [editingId, setEditingId] = React.useState("");
  const [editingOfferings, setEditingOfferings] = React.useState(() => new Set());
  const [editingIngredients, setEditingIngredients] = React.useState(() => new Set());

  React.useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAdminConfigured(Boolean(data?.adminConfigured));
      } catch {
        setAdminConfigured(false);
      }
    }
    loadStatus();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function checkToken() {
      if (!token) {
        setTokenStatus("missing");
        return;
      }
      try {
        const trimmed = String(token).trim();
        const res = await fetch(`${API_BASE}/api/admin/token-check`, {
          headers: { "x-admin-token": trimmed }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (cancelled) return;
        setTokenStatus("ok");
      } catch {
        if (cancelled) return;
        setTokenStatus("bad");
      }
    }
    checkToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function toggleOffering(k) {
    setOfferings((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function toggleEditingOffering(k) {
    setEditingOfferings((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function toggleEditingIngredient(k) {
    setEditingIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function startEdit(pantry) {
    setEditingId(pantry.id);
    setEditingOfferings(new Set(pantry.offerings || []));
    setEditingIngredients(new Set(pantry.availableIngredients || []));
  }

  async function saveEditingOfferings(pantry) {
    setError("");
    try {
      const payload = {
        ...pantry,
        offerings: Array.from(editingOfferings),
        availableIngredients: Array.from(editingIngredients),
        lastVerified: new Date().toISOString().slice(0, 10)
      };

      const res = await fetch(`${API_BASE}/api/pantries/${encodeURIComponent(pantry.id)}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            "x-admin-token": String(token).trim()
          },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setEditingId("");
      setEditingOfferings(new Set());
      setEditingIngredients(new Set());
      await onChanged();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function createPantry() {
    setError("");
    if (!id.trim() || !name.trim()) {
      setError(lang === "es" ? "ID y nombre son requeridos." : "ID and name are required.");
      return;
    }
    try {
      const payload = {
        id: id.trim(),
        name: name.trim(),
        address1: address1.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        lat: lat.trim() ? Number(lat) : null,
        lng: lng.trim() ? Number(lng) : null,
        phone: phone.trim(),
        website: website.trim(),
        hoursText: hoursText.trim(),
        eligibilityText: eligibilityText.trim(),
        notes: notes.trim(),
        lastVerified: lastVerified.trim(),
        offerings: Array.from(offerings)
      };

      const res = await fetch(`${API_BASE}/api/pantries`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": String(token).trim()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setId("");
      setName("");
      setAddress1("");
      setCity("");
      setState("TX");
      setZip("");
      setLat("");
      setLng("");
      setPhone("");
      setWebsite("");
      setHoursText("");
      setEligibilityText("");
      setNotes("");
      setLastVerified("");
      setOfferings(new Set());

      await onChanged();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function deletePantry(pantryId) {
    setError("");
    if (!confirm(lang === "es" ? "¿Borrar esta despensa?" : "Delete this pantry?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/pantries/${encodeURIComponent(pantryId)}`, {
        method: "DELETE",
        headers: { "x-admin-token": String(token).trim() }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      await onChanged();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  return (
    <div className="panel" role="main">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <button onClick={() => navigate("/")}>{lang === "es" ? "← Buscar" : "← Search"}</button>
      </div>

      <h2 style={{ margin: "8px 0 6px" }}>{lang === "es" ? "Administración" : "Admin"}</h2>

      {adminConfigured === false ? (
        <p className="hint" style={{ marginTop: 0 }}>
          {lang === "es"
            ? "Admin no está configurado en el servidor (falta ADMIN_TOKEN)."
            : "Admin is not configured on the server (missing ADMIN_TOKEN)."}
        </p>
      ) : null}

      <div className="twoCol">
        <div className="panel" style={{ padding: 12 }}>
          <p className="hint" style={{ margin: "0 0 6px" }}>
            {lang === "es" ? "Token de admin" : "Admin token"}
          </p>
          <input
            type="text"
            value={token}
            onChange={(e) => {
              const next = e.target.value;
              setToken(next);
              setStoredAdminToken(next);
            }}
            placeholder={lang === "es" ? "Pega el token" : "Paste token"}
          />
          <p className="hint" style={{ margin: "8px 0 0" }}>
            {(tokenStatus === "ok" && (lang === "es" ? "Token válido." : "Token OK.")) ||
              (tokenStatus === "missing" && (lang === "es" ? "Falta token." : "Token missing.")) ||
              (tokenStatus === "bad" && (lang === "es" ? "Token inválido." : "Token invalid.")) ||
              (lang === "es" ? "Verificando..." : "Checking...")}
          </p>

          <div className="divider" />

          <p className="hint" style={{ margin: "0 0 6px" }}>
            {lang === "es" ? "Agregar despensa" : "Add pantry"}
          </p>

          <label htmlFor="pid">ID</label>
          <input id="pid" type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder="unique-id" />
          <div style={{ height: 8 }} />

          <label htmlFor="pname">{lang === "es" ? "Nombre" : "Name"}</label>
          <input id="pname" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <div style={{ height: 8 }} />

          <label htmlFor="paddr">{lang === "es" ? "Dirección" : "Address"}</label>
          <input id="paddr" type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          <div style={{ height: 8 }} />

          <div className="row">
            <div className="col">
              <label htmlFor="pcity">{lang === "es" ? "Ciudad" : "City"}</label>
              <input id="pcity" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="col">
              <label htmlFor="pstate">{lang === "es" ? "Estado" : "State"}</label>
              <input id="pstate" type="text" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="col">
              <label htmlFor="pzip">ZIP</label>
              <input id="pzip" type="text" value={zip} onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))} />
            </div>
          </div>

          <div style={{ height: 8 }} />

          <div className="row">
            <div className="col">
              <label htmlFor="plat">Lat</label>
              <input id="plat" type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="26.123" />
            </div>
            <div className="col">
              <label htmlFor="plng">Lng</label>
              <input id="plng" type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-98.123" />
            </div>
          </div>

          <div style={{ height: 8 }} />

          <label htmlFor="pphone">{lang === "es" ? "Teléfono" : "Phone"}</label>
          <input id="pphone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div style={{ height: 8 }} />

          <label htmlFor="pweb">{lang === "es" ? "Sitio" : "Website"}</label>
          <input id="pweb" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <div style={{ height: 8 }} />

          <label htmlFor="phours">{lang === "es" ? "Horarios" : "Hours"}</label>
          <input id="phours" type="text" value={hoursText} onChange={(e) => setHoursText(e.target.value)} />
          <div style={{ height: 8 }} />

          <label htmlFor="pel">{lang === "es" ? "Elegibilidad" : "Eligibility"}</label>
          <input id="pel" type="text" value={eligibilityText} onChange={(e) => setEligibilityText(e.target.value)} />
          <div style={{ height: 8 }} />

          <label htmlFor="pnotes">{lang === "es" ? "Notas" : "Notes"}</label>
          <input id="pnotes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div style={{ height: 8 }} />

          <label htmlFor="pver">{lang === "es" ? "Verificado" : "Last verified"}</label>
          <input id="pver" type="text" value={lastVerified} onChange={(e) => setLastVerified(e.target.value)} placeholder="2026-04-18" />

          <div className="divider" />

          <p className="hint" style={{ margin: "0 0 8px" }}>
            {lang === "es" ? "Lo que ofrecen" : "Offerings"}
          </p>
          <div className="tags" role="group" aria-label="offerings">
            {Object.keys(OFFERING_LABELS).map((k) => {
              const on = offerings.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  className={on ? "tag tagOn" : "tag"}
                  onClick={() => toggleOffering(k)}
                >
                  {formatOffering(k, lang)}
                </button>
              );
            })}
          </div>

          <div className="actions">
            <button
              className="btnPrimary"
              type="button"
              onClick={createPantry}
              disabled={tokenStatus !== "ok"}
            >
              {lang === "es" ? "Agregar" : "Add"}
            </button>
          </div>

          {error ? (
            <p className="hint" style={{ margin: "10px 0 0", color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}
        </div>

        <div className="panel" style={{ padding: 12 }}>
          <p className="hint" style={{ margin: "0 0 10px" }}>
            {lang === "es" ? "Despensas" : "Pantries"} ({pantries?.length || 0})
          </p>

          {pantriesStatus === "loading" ? (
            <p className="hint" style={{ margin: 0 }}>
              {lang === "es" ? "Cargando..." : "Loading..."}
            </p>
          ) : null}

          <div className="grid">
            {(pantries || []).map((p) => (
              <div key={p.id} className="card">
                <h3>{p.name}</h3>
                <p className="meta" style={{ margin: "0 0 8px" }}>{p.id}</p>

                <div className="tags" style={{ marginBottom: 8 }}>
                  {(p.offerings || []).slice(0, 8).map((t) => (
                    <span key={t} className="tag">{formatOffering(t, lang)}</span>
                  ))}
                </div>

                {editingId === p.id ? (
                  <>
                    <p className="hint" style={{ margin: "0 0 8px" }}>
                      {lang === "es" ? "Editar ofertas" : "Edit offerings"}
                    </p>
                    <div className="tags" role="group" aria-label="edit offerings">
                      {Object.keys(OFFERING_LABELS).map((k) => {
                        const on = editingOfferings.has(k);
                        return (
                          <button
                            key={k}
                            type="button"
                            className={on ? "tag tagOn" : "tag"}
                            onClick={() => toggleEditingOffering(k)}
                          >
                            {formatOffering(k, lang)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="divider" />

                    <p className="hint" style={{ margin: "0 0 8px" }}>
                      {lang === "es" ? "Ingredientes disponibles (esta semana)" : "Available ingredients (this week)"}
                    </p>
                    <div className="checklist">
                      {INGREDIENTS.map((it) => {
                        const on = editingIngredients.has(it.key);
                        return (
                          <label key={it.key} className="check">
                            <input type="checkbox" checked={on} onChange={() => toggleEditingIngredient(it.key)} />
                            <div style={{ fontWeight: 600 }}>{it.label[lang] || it.key}</div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="actions">
                      <button
                        className="btnPrimary"
                        type="button"
                        onClick={() => saveEditingOfferings(p)}
                        disabled={tokenStatus !== "ok"}
                      >
                        {lang === "es" ? "Guardar" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId("");
                          setEditingOfferings(new Set());
                          setEditingIngredients(new Set());
                        }}
                      >
                        {lang === "es" ? "Cancelar" : "Cancel"}
                      </button>
                    </div>
                  </>
                ) : null}

                <div className="actions">
                  <button type="button" onClick={() => navigate(`/pantry/${p.id}`)}>
                    {lang === "es" ? "Ver" : "View"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    disabled={tokenStatus !== "ok"}
                  >
                    {lang === "es" ? "Editar" : "Edit"}
                  </button>
                  <button
                    className="btnDanger"
                    type="button"
                    onClick={() => deletePantry(p.id)}
                    disabled={tokenStatus !== "ok"}
                  >
                    {lang === "es" ? "Borrar" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

if (!window.location.hash) {
  window.location.hash = "#/";
}
