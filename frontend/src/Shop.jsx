import React, { useMemo, useState } from "react";
import useCompactLayout from "./utils/useCompactLayout";
import { useI18n } from "./i18n";
import { getDinoPrice, getPromotionPrice, getUniqueDinoPrice } from "../../shared/game-mechanics.mjs";
import { formatRewardList } from "./utils/localizedGameData";

const base = import.meta.env.BASE_URL || "/";

function fmt(n) {
  const number = Number(n) || 0;
  if (number >= 1e12) return `${(number / 1e12).toFixed(2)}T`;
  if (number >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
  if (number >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(2)}K`;
  if (number >= 100) return Math.round(number).toString();
  if (number >= 10) return number.toFixed(1).replace(/\.0$/, "");
  if (number >= 1) return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return number > 0 ? number.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") : "0";
}

function paletteForDino(dino) {
  const rarity = (dino.rarity || "common").toLowerCase();
  const palettes = {
    common: { bg: "linear-gradient(180deg,#38bdf8,#0369a1)", accent: "#0f172a", stroke: "rgba(14,116,144,0.22)" },
    uncommon: { bg: "linear-gradient(180deg,#4ade80,#15803d)", accent: "#14532d", stroke: "rgba(34,197,94,0.22)" },
    rare: { bg: "linear-gradient(180deg,#f59e0b,#b45309)", accent: "#78350f", stroke: "rgba(245,158,11,0.22)" },
    epic: { bg: "linear-gradient(180deg,#8b5cf6,#5b21b6)", accent: "#312e81", stroke: "rgba(139,92,246,0.22)" },
    legendary: { bg: "linear-gradient(180deg,#f97316,#c2410c)", accent: "#7c2d12", stroke: "rgba(249,115,22,0.22)" },
    mythic: { bg: "linear-gradient(180deg,#ec4899,#be185d)", accent: "#831843", stroke: "rgba(236,72,153,0.22)" },
    unique: { bg: "linear-gradient(180deg,#f59e0b,#be123c)", accent: "#7c2d12", stroke: "rgba(251,113,133,0.22)" }
  };

  return palettes[rarity] || palettes.common;
}

function paletteForPromotion(index) {
  const palettes = [
    { bg: "linear-gradient(180deg,#f59e0b,#b45309)", accent: "#431407" },
    { bg: "linear-gradient(180deg,#60a5fa,#1d4ed8)", accent: "#172554" },
    { bg: "linear-gradient(180deg,#f472b6,#be185d)", accent: "#500724" },
    { bg: "linear-gradient(180deg,#2dd4bf,#0f766e)", accent: "#042f2e" },
    { bg: "linear-gradient(180deg,#fb7185,#be123c)", accent: "#4c0519" },
    { bg: "linear-gradient(180deg,#a78bfa,#4f46e5)", accent: "#1e1b4b" }
  ];
  return palettes[index % palettes.length];
}

function getItemResourceType(item, entry = null) {
  return entry?.resourceType === "ferns" || item?.productionResource === "ferns" ? "ferns" : "meat";
}

function getItemOutputValue(item, entry = null, mode = "current") {
  if (mode === "adult") {
    return Number(entry?.adultOutputPerSec ?? entry?.adultMeatPerSec ?? item?.meatPerSec ?? item?.baseMeatPerSec ?? 0) || 0;
  }
  if (mode === "total") {
    return Number(entry?.totalOutput ?? entry?.totalProduction ?? 0) || 0;
  }
  return Number(entry?.outputPerSec ?? entry?.meatPerSec ?? ((item?.meatPerSec || item?.baseMeatPerSec || 0) * 0.55)) || 0;
}

function getItemOutputLabel(t, item, entry = null, mode = "currentAvg") {
  const resource = getItemResourceType(item, entry) === "ferns"
    ? t("resource.ferns", {}, "Ferns").toLowerCase()
    : t("resource.meat", {}, "Meat").toLowerCase();

  if (mode === "adultAvg") return t("shop.adultAvgOutput", { resource }, `Adult avg ${resource} / s`);
  if (mode === "currentAvg") return t("shop.currentAvgOutput", { resource }, `Current avg ${resource} / s`);
  if (mode === "adult") return t("shop.adultOutputShort", { resource }, `Adult ${resource} / s`);
  if (mode === "total") return t("shop.totalOutputResource", { resource }, `Total ${resource} flow`);
  return `${resource} / s`;
}
function localizeRarityLabel(t, rarity = "common") {
  const normalized = String(rarity || "common").toLowerCase();
  return t(`rarity.${normalized}`, {}, normalized);
}

function StatTile({ label, value, tone = "#f8fafc" }) {
  return (
    <div style={{ padding: "clamp(8px, 2.4vw, 10px)", borderRadius: 14, background: "rgba(30,41,59,0.82)", border: "1px solid rgba(129,140,248,0.24)" }}>
      <div style={{ color: "rgba(226,232,240,0.68)", fontSize: "clamp(9px, 2.2vw, 11px)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ marginTop: 5, color: tone, fontSize: "clamp(14px, 3.8vw, 18px)", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function SexChoiceButton({ sex, label, priceLabel, onClick }) {
  const female = sex === "female";
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "none",
        background: female ? "linear-gradient(180deg,#ec4899,#be185d)" : "linear-gradient(180deg,#60a5fa,#1d4ed8)",
        color: female ? "#831843" : "#172554",
        fontWeight: 900,
        cursor: "pointer"
      }}
    >
      {label} {priceLabel}
    </button>
  );
}

function FooterPills({ items = [] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))`, gap: 6 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: "7px 8px",
            borderRadius: 10,
            background: "linear-gradient(180deg, rgba(248,250,252,0.24), rgba(148,163,184,0.12))",
            border: "1px solid rgba(226,232,240,0.16)",
            color: item.tone || "#f8fafc",
            fontSize: 11,
            fontWeight: 900,
            lineHeight: 1.15,
            textAlign: "center",
            textShadow: "0 1px 2px rgba(15,23,42,0.28)"
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

function DinoDetailsModal({ item, entry, count, onBuy, onClose, compact = false, t }) {
  if (!item) return null;

  const isPromotion = Boolean(item.channel);
  const isUnique = !isPromotion && !Object.prototype.hasOwnProperty.call(item, "cost");
  const price = isPromotion
    ? getPromotionPrice(item.baseFernsCost, count)
    : (isUnique ? getUniqueDinoPrice(item.baseFernsCost, count) : getDinoPrice(item.cost, count));
  const nextPrice = isPromotion
    ? getPromotionPrice(item.baseFernsCost, count + 1)
    : (isUnique ? getUniqueDinoPrice(item.baseFernsCost, count + 1) : getDinoPrice(item.cost, count + 1));
  const currentAverage = getItemOutputValue(item, entry, "current");
  const adultAverage = getItemOutputValue(item, entry, "adult");
  const adultRangeMin = item.meatPerSec ? Math.max(1, Math.round(item.meatPerSec * 0.88)) : 0;
  const adultRangeMax = item.meatPerSec ? Math.max(1, Math.round(item.meatPerSec * 1.12)) : 0;
  const totalProduction = getItemOutputValue(item, entry, "total");
  const totalAttractiveness = entry?.totalAttractiveness || 0;
  const femaleCount = entry?.femaleCount || 0;
  const maleCount = entry?.maleCount || 0;
  const pal = isPromotion ? paletteForPromotion(0) : paletteForDino(item);
  const rarityTypeLabel = isPromotion ? (item.channel || t("rarity.special", {}, "special")) : localizeRarityLabel(t, item.rarity);
  const priceLabel = isPromotion ? `${price} ${t("units.ferns.other", {}, "ferns")}` : (isUnique ? `${price} ${t("units.ferns.other", {}, "ferns")}` : `${fmt(price)} ${t("units.meat.one", {}, "meat")}`);
  const nextPriceLabel = isPromotion ? `${nextPrice} ${t("units.ferns.other", {}, "ferns")}` : (isUnique ? `${nextPrice} ${t("units.ferns.other", {}, "ferns")}` : `${fmt(nextPrice)} ${t("units.meat.one", {}, "meat")}`);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.68)", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: compact ? "min(96vw, 720px)" : "min(96vw, 780px)", maxHeight: "90vh", overflow: "auto", borderRadius: compact ? 24 : 30, background: "linear-gradient(180deg,#0f172a,#312e81)", border: "1px solid rgba(129,140,248,0.24)", padding: compact ? 16 : 22, color: "#f8fafc", display: "grid", gap: compact ? 14 : 18, boxShadow: "0 24px 80px rgba(15,23,42,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: compact ? 24 : 30, fontWeight: 900 }}>{item.name}</div>
            <div style={{ marginTop: 6, color: "#cbd5e1", maxWidth: 560, fontSize: compact ? 13 : 15 }}>{item.blurb || t("shop.defaultBlurb", {}, "A shiny new crowd-pleaser for your dino zoo.")}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#cbd5e1", fontSize: 18, cursor: "pointer" }}>x</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: compact ? 12 : 16 }}>
          <div style={{ minHeight: compact ? 180 : 260, borderRadius: compact ? 20 : 26, background: pal.bg, display: "grid", placeItems: "center", padding: compact ? 14 : 20, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}>
            {!isPromotion ? (
              <img
                src={`${base}dinos/${item.id}.png`}
                alt={item.name}
                style={{ width: "100%", maxWidth: compact ? 180 : 240, maxHeight: compact ? 150 : 220, objectFit: "contain", filter: "drop-shadow(0 18px 30px rgba(15,23,42,0.18))" }}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = `${base}dinos/basic.png`;
                }}
              />
            ) : (
              <div style={{ fontSize: 74, fontWeight: 900, color: pal.accent }}>{t("shop.adShort", {}, "Ad")}</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
            <StatTile label={t("shop.owned", {}, "Owned")} value={count} />
            {!isPromotion ? <StatTile label={t("shop.females", {}, "Females")} value={femaleCount} tone="#f9a8d4" /> : null}
            {!isPromotion ? <StatTile label={t("shop.males", {}, "Males")} value={maleCount} tone="#93c5fd" /> : null}
            <StatTile label={t("shop.rarityType", {}, "Rarity / Type")} value={rarityTypeLabel} tone="#ddd6fe" />
            <StatTile label={t("shop.nextCost", {}, "Next cost")} value={priceLabel} tone="#fde68a" />
            <StatTile label={t("shop.afterNext", {}, "After next")} value={nextPriceLabel} tone="#fde68a" />
          </div>
        </div>

        {!isPromotion ? (
          <div style={{ display: "grid", gridTemplateColumns: compact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(180px, 1fr))", gap: compact ? 8 : 10 }}>
            <StatTile label={getItemOutputLabel(t, item, entry, "currentAvg")} value={`${fmt(currentAverage)}/s`} tone="#86efac" />
            <StatTile label={getItemOutputLabel(t, item, entry, "adultAvg")} value={`${fmt(adultAverage)}/s`} tone="#86efac" />
            <StatTile label={t("shop.adultRange", {}, "Adult range")} value={`${fmt(adultRangeMin)} - ${fmt(adultRangeMax)} /s`} tone="#93c5fd" />
            <StatTile label={t("shop.zooCharm", {}, "Zoo charm")} value={fmt(totalAttractiveness)} tone="#fda4af" />
            <StatTile label={getItemOutputLabel(t, item, entry, "total")} value={`${fmt(totalProduction)}/s`} tone="#93c5fd" />
            <StatTile label={t("shop.growth", {}, "Growth")} value={t("shop.adultsMature48h", {}, "Adults mature after 48h, even while you are offline.")} tone="#ddd6fe" />
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          {isPromotion ? (
            <button
              onClick={() => onBuy(item)}
              style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: pal.bg, color: pal.accent, fontWeight: 900, cursor: "pointer" }}
            >
              {t("shop.launchFor", { price: price, unit: t("units.ferns.other", {}, "ferns") }, `Launch for ${price} ferns`)}
            </button>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <SexChoiceButton sex="female" label={t("shop.buyFemale", {}, "Buy female")} priceLabel={priceLabel} onClick={() => onBuy(item, "female")} />
              <SexChoiceButton sex="male" label={t("shop.buyMale", {}, "Buy male")} priceLabel={priceLabel} onClick={() => onBuy(item, "male")} />
            </div>
          )}

          <div style={{ color: "#cbd5e1", fontSize: 13 }}>
            {isPromotion
              ? t("shop.promotionHelp", {}, "Promotions make your zoo brighter and busier without adding a new dinosaur body to care for.")
              : t("shop.sexHelp", {}, "Open the card to choose a female or male hatch. That sex will also matter in the breeding tab later.")}
          </div>
        </div>
      </div>
    </div>
  );
}

function DinoCard({ title, badge, visual, footer, accent, onOpen, compact = false }) {
  return (
    <button onClick={onOpen} style={{ padding: 0, border: "none", background: "transparent", textAlign: "left", cursor: "pointer", height: "100%" }}>
      <div style={{ minHeight: compact ? 184 : 228, height: "100%", borderRadius: compact ? 18 : 22, padding: compact ? 10 : 12, display: "grid", gridTemplateRows: compact ? "auto 82px auto" : "auto 108px auto", gap: compact ? 8 : 10, background: visual.bg, boxShadow: "0 18px 36px rgba(15,23,42,0.12)", border: `1px solid ${visual.stroke || "rgba(132,147,170,0.28)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
          <div>
            <div style={{ color: accent, fontWeight: 900, fontSize: compact ? 12 : 15, lineHeight: 1.1 }}>{title}</div>
            <div style={{ marginTop: 4, padding: compact ? "3px 7px" : "4px 8px", display: "inline-flex", borderRadius: 999, background: "rgba(140,154,176,0.48)", color: accent, fontSize: compact ? 8 : 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{badge}</div>
          </div>
        </div>

        <div style={{ minHeight: compact ? 82 : 108, borderRadius: compact ? 14 : 18, background: "rgba(149,163,184,0.38)", display: "grid", placeItems: "center", padding: compact ? 6 : 10 }}>
          {visual.content}
        </div>

        <div style={{ padding: compact ? "7px 9px" : "9px 11px", borderRadius: 12, background: "rgba(8,15,32,0.54)", color: accent, fontSize: compact ? 10 : 11, fontWeight: 900, lineHeight: 1.2 }}>
          {footer}
        </div>
      </div>
    </button>
  );
}

function DinoSpeciesCard({ dino, count, collectionEntry, onOpen, compact = false, t }) {
  const price = getDinoPrice(dino.cost, count);
  const pal = paletteForDino(dino);
  const currentAverage = getItemOutputValue(dino, collectionEntry, "current");
  return (
    <DinoCard
      title={dino.name}
      badge={localizeRarityLabel(t, dino.rarity)}
      visual={{
        ...pal,
        content: (
          <img
            src={`${base}dinos/${dino.id}.png`}
            alt={dino.name}
            style={{ width: "100%", maxHeight: compact ? 72 : 108, objectFit: "contain", display: "block" }}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = `${base}dinos/basic.png`;
            }}
          />
        )
      }}
      accent={pal.accent}
      footer={<FooterPills items={[{ label: `${getItemOutputLabel(t, dino, collectionEntry, "currentAvg")}: ${fmt(currentAverage)}/s`, tone: "#dcfce7" }, { label: `${t("shop.next", {}, "Next")} ${fmt(price)} ${t("units.meat.one", {}, "meat")}`, tone: "#fde68a" }]} />}
      onOpen={() => onOpen(dino)}
      compact={compact}
    />
  );
}

function UniqueDinoCard({ dino, count, onOpen, compact = false, t }) {
  const cost = getUniqueDinoPrice(dino.baseFernsCost, count);
  const pal = paletteForDino(dino);
  const multiplier = Math.pow(dino.incomeMultiplier || 1, count);
  return (
    <DinoCard
      title={dino.name}
      badge={t("shop.unique", {}, "unique")}
      visual={{
        ...pal,
        content: (
          <img
            src={`${base}dinos/${dino.id}.png`}
            alt={dino.name}
            style={{ width: "100%", maxHeight: compact ? 72 : 108, objectFit: "contain" }}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = `${base}dinos/basic.png`;
            }}
          />
        )
      }}
      accent={pal.accent}
      footer={<FooterPills items={[{ label: `${t("shop.boost", {}, "Boost")} x${multiplier.toFixed(2)}`, tone: "#ddd6fe" }, { label: `${t("shop.next", {}, "Next")} ${cost} ${t("units.ferns.other", {}, "ferns")}`, tone: "#fde68a" }]} />}
      onOpen={() => onOpen(dino)}
      compact={compact}
    />
  );
}

function PromotionCard({ promotion, index, count, onOpen, compact = false, t }) {
  const pal = paletteForPromotion(index);
  const cost = getPromotionPrice(promotion.baseFernsCost, count);
  const totalMultiplier = Math.pow(promotion.incomeMultiplier || 1, count);
  return (
    <DinoCard
      title={promotion.name}
      badge={promotion.channel}
      visual={{
        ...pal,
        stroke: "rgba(132,147,170,0.28)",
        content: <div style={{ fontSize: 52, fontWeight: 900, color: pal.accent }}>{promotion.channel.slice(0, 2).toUpperCase()}</div>
      }}
      accent={pal.accent}
      footer={<FooterPills items={[{ label: `${t("shop.boost", {}, "Boost")} x${totalMultiplier.toFixed(2)}`, tone: "#fde68a" }, { label: `${t("shop.next", {}, "Next")} ${cost} ${t("units.ferns.other", {}, "ferns")}`, tone: "#fbcfe8" }]} />}
      onOpen={() => onOpen(promotion)}
      compact={compact}
    />
  );
}

export default function Shop({
  dinos = [],
  fernDinos = [],
  promotions = [],
  collection = { entries: [] },
  owned = {},
  buyDino = () => {},
  buyUniqueDino = () => {},
  buyPromotion = () => {}
}) {
  const { t } = useI18n();
  const [selectedItem, setSelectedItem] = useState(null);
  const isCompact = useCompactLayout(720);
  const collectionMap = useMemo(() => new Map((collection?.entries || []).map((entry) => [entry.id, entry])), [collection]);

  const selectedEntry = selectedItem ? collectionMap.get(selectedItem.id) || null : null;
  const selectedCount = selectedItem ? owned[selectedItem.id] || 0 : 0;

  return (
    <>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isCompact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(178px, 1fr))", gap: isCompact ? 10 : 12, alignItems: "stretch" }}>
          {dinos.map((dino) => (
            <DinoSpeciesCard key={dino.id} dino={dino} count={owned[dino.id] || 0} collectionEntry={collectionMap.get(dino.id)} onOpen={setSelectedItem} compact={isCompact} t={t} />
          ))}
        </div>

        {fernDinos.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0, color: "#fbbf24" }}>{t("shop.uniqueFernDinosaurs", {}, "Unique Fern Dinosaurs")}</h4>
            <div style={{ color: "#cbd5e1", fontSize: 13 }}>{t("shop.uniqueFernDescription", {}, "Special showcase dinos with brighter looks and long-term zoo boosts.")}</div>
            <div style={{ display: "grid", gridTemplateColumns: isCompact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(178px, 1fr))", gap: isCompact ? 10 : 12, alignItems: "stretch" }}>
              {fernDinos.map((dino) => (
                <UniqueDinoCard key={dino.id} dino={dino} count={owned[dino.id] || 0} onOpen={setSelectedItem} compact={isCompact} t={t} />
              ))}
            </div>
          </div>
        ) : null}

        {promotions.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0, color: "#f472b6" }}>{t("shop.zooPromotions", {}, "Zoo Promotions")}</h4>
            <div style={{ color: "#cbd5e1", fontSize: 13 }}>{t("shop.zooPromotionsDescription", {}, "Colorful media boosts that make your zoo louder, busier and more exciting for families.")}</div>
            <div style={{ display: "grid", gridTemplateColumns: isCompact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(220px, 1fr))", gap: isCompact ? 10 : 12, alignItems: "stretch" }}>
              {promotions.map((promotion, index) => (
                <PromotionCard key={promotion.id} promotion={promotion} index={index} count={owned[promotion.id] || 0} onOpen={setSelectedItem} compact={isCompact} t={t} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <DinoDetailsModal
        item={selectedItem}
        entry={selectedEntry}
        count={selectedCount}
        compact={isCompact}
        t={t}
        onBuy={(item, sex = "male") => {
          if (!item) return;
          if (item.channel) {
            buyPromotion(item);
            return;
          }

          const isUnique = !Object.prototype.hasOwnProperty.call(item, "cost");
          if (isUnique) {
            buyUniqueDino(item, sex);
          } else {
            buyDino(item, sex);
          }
        }}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}


