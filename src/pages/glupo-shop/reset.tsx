import { rootStore } from "@/stores";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import styles from "./reset.module.css";

function Reset() {
  const { glupo } = rootStore;
  const { t } = useTranslation();

  return (
    <button
      className={styles.container}
      onClick={glupo.reset}
      disabled={glupo.balance < glupo.resetCost}
    >
      <p>{t("glupo.shop.reset")}</p>
      <span>{glupo.resetCost}</span>
    </button>
  );
}

export default observer(Reset);
