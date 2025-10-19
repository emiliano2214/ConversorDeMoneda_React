// conversordemoneda.client/src/Components/ConversionDeMoneda.tsx
import React from "react";
import { useEffect, useMemo, useState } from "react";

type Rates = Record<string, number>;

type HistoryItem = {
    ts: number;
    from: string;
    to: string;
    amount: number;
    result: number;
};

const CURRENCIES = [
    { code: "USD", label: "US Dollar" },
    { code: "EUR", label: "Euro" },
    { code: "ARS", label: "Peso argentino" },
    { code: "BRL", label: "Real brasileño" },
    { code: "GBP", label: "Libra esterlina" },
    { code: "JPY", label: "Yen japonés" },
];

const DEFAULT_RATES: Rates = {
    USD: 1,
    EUR: 0.92,
    ARS: 980,
    BRL: 5.6,
    GBP: 0.78,
    JPY: 150,
};

// Formato monetario
const fmt = (value: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 4,
    }).format(value);

// amount (FROM) -> TO usando "unidades por 1 USD"
function convert(amount: number, from: string, to: string, rates: Rates) {
    if (!Number.isFinite(amount)) return 0;
    const uFrom = rates[from];
    const uTo = rates[to];
    if (!uFrom || !uTo || uFrom <= 0) return 0;
    const inUSD = amount / uFrom; // FROM -> USD
    return inUSD * uTo;           // USD -> TO
}

export default function ConversionDeMoneda() {
    const [amount, setAmount] = useState("100");
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("EUR");
    const [rates, setRates] = useState<Rates>({ ...DEFAULT_RATES });

    // Fuente del BCRA:
    // "usd_of" = oficial mayorista | "usd_of_minorista" = promedio bancos (al público)
    const [serie, setSerie] = useState<"usd_of" | "usd_of_minorista">("usd_of_minorista");
    const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
    const [arsBloqueado, setArsBloqueado] = useState(true);

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loadingApi, setLoadingApi] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Resultado
    const result = useMemo(() => {
        const n = Number((amount ?? "").replace(",", "."));
        return convert(n, from, to, rates);
    }, [amount, from, to, rates]);

    // Historial
    useEffect(() => {
        const n = Number((amount ?? "").replace(",", "."));
        if (!Number.isFinite(n)) return;
        const entry: HistoryItem = { ts: Date.now(), from, to, amount: n, result };
        setHistory((h) => [entry, ...h].slice(0, 7));
    }, [result, amount, from, to]);

    // Traer ARS desde tu backend con la serie seleccionada
    const updateArsFromBcra = async (currentSerie = serie) => {
        const ctrl = new AbortController();
        try {
            setLoadingApi(true);
            setApiError(null);
            const resp = await fetch(`/api/bcra/usd?serie=${currentSerie}`, { signal: ctrl.signal });
            if (!resp.ok) throw new Error("No se pudo obtener USD del servidor");
            const data: { date: string; value: number } = await resp.json();
            setRates((prev) => ({ ...prev, ARS: Number(data.value) || prev.ARS }));
            setUltimaFecha(data.date);
        } catch (e: any) {
            if (e?.name !== "AbortError") setApiError(e?.message ?? "Error desconocido");
        } finally {
            setLoadingApi(false);
        }
        return () => ctrl.abort();
    };

    // Al montar y cuando cambie la serie, actualizar ARS desde BCRA
    useEffect(() => {
        updateArsFromBcra(serie);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serie]);

    // Tasas generales (base USD) desde exchangerate.host (opcional)
    const fetchRates = async () => {
        try {
            setLoadingApi(true);
            setApiError(null);
            const resp = await fetch("https://api.exchangerate.host/latest?base=USD");
            if (!resp.ok) throw new Error("No se pudo obtener tasas");
            const data = await resp.json();
            if (!data?.rates) throw new Error("Respuesta inesperada");
            const next: Rates = { USD: 1 };
            for (const { code } of CURRENCIES) {
                if (code === "USD") continue;
                const v = data.rates[code];
                if (typeof v === "number") next[code] = v;
            }
            setRates((prev) => ({ ...prev, ...next }));
        } catch (e: any) {
            setApiError(e?.message ?? "Error desconocido");
        } finally {
            setLoadingApi(false);
        }
    };

    const swap = () => {
        setFrom((f) => {
            setTo(f);
            return to;
        });
    };

    const handleRateChange = (code: string, value: string) => {
        const n = Number((value ?? "").replace(",", "."));
        setRates((r) => ({ ...r, [code]: Number.isFinite(n) && n > 0 ? n : r[code] }));
    };

    const tasaImplicita = (() => {
        const uFrom = rates[from];
        const uTo = rates[to];
        if (!Number.isFinite(uFrom) || !Number.isFinite(uTo) || uFrom <= 0) return "-";
        return (uTo / uFrom).toFixed(6);
    })();

    return (
        <div style={{ minHeight: "100vh", padding: "2rem", background: "#f8fafc", color: "#0f172a" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
                <header style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Conversor de Monedas</h1>
                    <p style={{ marginTop: 6, color: "#475569", fontSize: 14 }}>
                        Tasas expresadas como <strong>“unidades por 1 USD”</strong>. ARS se actualiza desde el BCRA.
                    </p>
                </header>

                <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", padding: 24 }}>
                    {/* Controles principales */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Monto</label>
                            <input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="100"
                                style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", outline: "none" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Desde</label>
                            <select
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", outline: "none" }}
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} — {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Hacia</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <select
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", outline: "none" }}
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} — {c.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={swap}
                                    title="Intercambiar"
                                    style={{ borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", background: "#f8fafc", cursor: "pointer" }}
                                >
                                    ⇄
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resultado */}
                    <div style={{ border: "1px solid #e2e8f0", background: "#f1f5f9", padding: 16, borderRadius: 12, marginTop: 16 }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Resultado</p>
                        <p style={{ margin: "6px 0 0", fontWeight: 700, fontSize: 24 }}>{fmt(result || 0, to)}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                            Tasa implícita: 1 {from} = {tasaImplicita} {to}
                        </p>
                    </div>

                    {/* Panel de tasas */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginTop: 16 }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>Tasas (unidades por 1 USD)</p>

                        {/* Fuente BCRA */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                            <label style={{ fontSize: 14 }}>
                                Fuente ARS:
                                <select
                                    value={serie}
                                    onChange={(e) => setSerie(e.target.value as "usd_of" | "usd_of_minorista")}
                                    style={{ marginLeft: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                                >
                                    <option value="usd_of">BCRA – Oficial mayorista</option>
                                    <option value="usd_of_minorista">BCRA – Promedio bancos (al público)</option>
                                </select>
                            </label>

                            <button
                                onClick={() => updateArsFromBcra()}
                                disabled={loadingApi}
                                style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "8px 10px", background: "#fff", cursor: "pointer" }}
                            >
                                Actualizar ARS ahora
                            </button>

                            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={!arsBloqueado}
                                    onChange={(e) => setArsBloqueado(!e.target.checked)}
                                />
                                permitir editar ARS manualmente
                            </label>

                            {ultimaFecha && (
                                <span style={{ fontSize: 12, color: "#64748b" }}>
                                    Última fecha BCRA: {ultimaFecha}
                                </span>
                            )}

                            {apiError && <span style={{ color: "#dc2626", fontSize: 14 }}>{apiError}</span>}
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 12,
                                marginTop: 12,
                            }}
                        >
                            {CURRENCIES.map((c) => {
                                const readOnly = c.code === "ARS" && arsBloqueado;
                                return (
                                    <label key={c.code} style={{ fontSize: 13 }}>
                                        <span style={{ display: "block", marginBottom: 6, color: "#475569" }}>
                                            {c.code} — {c.label}
                                            {c.code === "ARS" && ultimaFecha && (
                                                <span style={{ marginLeft: 8, fontSize: 11, color: "#0ea5e9" }}>
                                                    (BCRA • {serie.replace("usd_of", "oficial").replace("_minorista", " minorista")})
                                                </span>
                                            )}
                                        </span>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={rates[c.code] ?? 0}
                                            onChange={(e) => handleRateChange(c.code, e.target.value)}
                                            readOnly={readOnly}
                                            style={{
                                                width: "100%",
                                                borderRadius: 12,
                                                border: "1px solid #cbd5e1",
                                                padding: "10px 12px",
                                                outline: "none",
                                                background: readOnly ? "#f8fafc" : "#fff",
                                            }}
                                            title={readOnly ? "Valor tomado del BCRA" : "Editable"}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Otras APIs (opcional) */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginTop: 16 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                                onClick={fetchRates}
                                disabled={loadingApi}
                                style={{ borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", background: "#fff", cursor: "pointer" }}
                            >
                                Actualizar tasas (exchangerate.host)
                            </button>
                            {apiError && <span style={{ color: "#dc2626", fontSize: 14 }}>{apiError}</span>}
                        </div>
                        <p style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                            Nota: en producción conviene cachear tasas en tu backend.
                        </p>
                    </div>
                </div>

                {/* Historial */}
                <section style={{ marginTop: 24 }}>
                    <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700 }}>Historial reciente</h2>
                    {history.length === 0 ? (
                        <p style={{ fontSize: 14, color: "#475569" }}>Aún no hay conversiones.</p>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                            {history.map((h) => (
                                <li key={h.ts} style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: "8px 12px", fontSize: 14 }}>
                                    {fmt(h.amount, h.from)} → <strong>{fmt(h.result, h.to)}</strong>
                                    <span style={{ color: "#64748b", marginLeft: 8 }}>[{new Date(h.ts).toLocaleTimeString()}]</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
