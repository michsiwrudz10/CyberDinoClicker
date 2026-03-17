import React from "react";
import { useI18n } from "../i18n";

export default function PassDrawer({
  open = false,
  onClose = () => {},
  pass = null,
  totalAttractiveness = 0,
  elitePassOwned = false,
  onOpenElitePassOffer = () => {}
}) {
  const { t } = useI18n();
  if (!open || !pass) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(2,6,23,0.64)", display: "grid", justifyItems: "end" }}>
      <div
        style={{
          width: "min(92vw, 420px)",
          height: "100vh",
          background: "linear-gradient(180deg,#081229,#0f172a)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.35)",
          color: "white",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr auto"
        }}
      >
        <div style={{ position: "sticky", top: 0, zIndex: 2, padding: 22, background: "linear-gradient(180deg, rgba(8,18,41,0.98), rgba(8,18,41,0.92))", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{pass.seasonName}</div>
              <div style={{ marginTop: 8, color: "#9ca3af", lineHeight: 1.5 }}>
                {t("pass.eraPowers", { era: pass?.currentEra?.label || "Small Zoo" }, `${pass?.currentEra?.label || "Small Zoo"} powers your current pass. Reach level 60 in an era to unlock the next zoo age and more dinosaurs.`)}
              </div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#9ca3af", fontSize: 18, cursor: "pointer" }}>
              x
            </button>
          </div>

          <div style={{ padding: 18, borderRadius: 22, background: "linear-gradient(180deg, rgba(14,165,233,0.18), rgba(34,197,94,0.12))", border: "1px solid rgba(45,212,191,0.2)", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <div>
                <div style={{ color: "#67e8f9", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>{t("pass.currentLevel", {}, "Current level")}</div>
                <div style={{ fontSize: 40, fontWeight: 900 }}>Lv. {pass.absoluteLevel || pass.currentLevel}</div>
                <div style={{ marginTop: 6, color: "#cbd5e1", fontSize: 13 }}>{pass?.currentEra?.label || "Small Zoo"} • {t("clicker.eraLevel", { level: `${pass?.eraLevel || pass.currentLevel}/${pass?.levelsPerEra || 60}` }, `Era level ${pass?.eraLevel || pass.currentLevel}/${pass?.levelsPerEra || 60}`)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#9ca3af", fontSize: 13 }}>{t("pass.sanctuaryCharm", {}, "Sanctuary charm")}</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>{Math.floor(totalAttractiveness).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${pass.progressPercent || 0}%`, height: "100%", background: "linear-gradient(90deg,#22c55e,#2dd4bf,#38bdf8)", borderRadius: 999, transition: "width 160ms ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#cbd5e1", fontSize: 13 }}>
                <span>{t("pass.passXp", { count: pass.xp }, `${pass.xp} pass XP`)}</span>
                <span>{pass.nextAbsoluteLevel ? t("pass.next", { level: pass.nextAbsoluteLevel }, `Next: Lv. ${pass.nextAbsoluteLevel}`) : t("pass.maxed", {}, "Maxed")}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "18px 22px", display: "grid", gap: 12, alignContent: "start" }}>
          {Array.isArray(pass.tiers) ? pass.tiers.map((tier) => (
            <div
              key={tier.level}
              style={{
                padding: 16,
                borderRadius: 18,
                background: tier.unlocked ? "rgba(34,197,94,0.11)" : "rgba(255,255,255,0.04)",
                border: tier.unlocked ? "1px solid rgba(74,222,128,0.28)" : "1px solid rgba(255,255,255,0.08)",
                display: "grid",
                gap: 10
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Level {tier.absoluteLevel || tier.level}</div>
                <div style={{ padding: "4px 10px", borderRadius: 999, background: tier.unlocked ? "rgba(74,222,128,0.16)" : "rgba(148,163,184,0.12)", color: tier.unlocked ? "#86efac" : "#cbd5e1", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                  {tier.unlocked ? t("pass.unlocked", {}, "Unlocked") : t("pass.unlockXp", { count: tier.xpRequired }, `${tier.xpRequired} XP`)}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ color: "#9ca3af", fontSize: 12, textTransform: "uppercase" }}>{t("pass.freeTrack", {}, "Free track")}</div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>{tier.freeReward}</div>
                </div>
                <button
                  onClick={() => {
                    if (!elitePassOwned) {
                      onOpenElitePassOffer(tier);
                    }
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: elitePassOwned ? "linear-gradient(180deg, rgba(34,197,94,0.18), rgba(21,128,61,0.12))" : "linear-gradient(180deg, rgba(251,191,36,0.12), rgba(249,115,22,0.08))",
                    border: elitePassOwned ? "1px solid rgba(34,197,94,0.24)" : "1px solid rgba(251,191,36,0.18)",
                    textAlign: "left",
                    cursor: elitePassOwned ? "default" : "pointer",
                    color: "white"
                  }}
                >
                  <div style={{ color: elitePassOwned ? "#86efac" : "#fcd34d", fontSize: 12, textTransform: "uppercase" }}>{elitePassOwned ? t("pass.eliteActive", {}, "Elite active") : t("pass.eliteTrack", {}, "Elite track")}</div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>{tier.eliteReward}</div>
                  <div style={{ marginTop: 8, color: "#cbd5e1", fontSize: 12 }}>
                    {elitePassOwned ? t("pass.premiumPurchased", {}, "Premium pass purchased for this season offer.") : t("pass.tapToView", {}, "Tap to view the elite pass purchase offer.")}
                  </div>
                </button>
              </div>
            </div>
          )) : null}
        </div>

        <div style={{ position: "sticky", bottom: 0, padding: 18, background: "linear-gradient(180deg, rgba(8,18,41,0.86), rgba(8,18,41,0.98))", borderTop: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: 10 }}>
          {!elitePassOwned ? (
            <button
              onClick={() => onOpenElitePassOffer(null)}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg,#f59e0b,#fb7185)",
                color: "#1f2937",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              {t("pass.viewEliteOffer", {}, "View Elite Pass Offer")}
            </button>
          ) : null}
          <button
            onClick={onClose}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
              color: "#cbd5e1",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {t("pass.close", {}, "Close pass")}
          </button>
        </div>
      </div>
    </div>
  );
}
