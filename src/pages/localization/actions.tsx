import { rootStore } from "@/stores";
import { Localization, Status } from "@/stores/models";
import { observer } from "mobx-react-lite";
import styles from "./actions.module.css";
import { Hammer, FolderDown, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Grid } from "react-loader-spinner";

interface ActionsProps {
  localization: Localization;
}

function Actions({ localization }: ActionsProps) {
  const { state, actions } = rootStore;
  const { t } = useTranslation();

  const installedVersion = state.installed?.[localization.id]?.version;
  const status = actions.getStatus(localization);
  const isIdle = status === Status.Idle && !actions.startingGame;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        {isIdle && (
          <>
            {!installedVersion && (
              <button onClick={handleInstall} title={t("localization.add")}>
                <Plus className="w-6 h-6 shrink-0" />
              </button>
            )}

            {installedVersion && (
              <>
                {installedVersion === localization.version ? (
                  <button onClick={handleRepair} title={t("localization.repair")}>
                    <Hammer className="w-6 h-6 shrink-0" />
                  </button>
                ) : (
                  <button onClick={handleRepair} title={t("localization.update")}>
                    <FolderDown className="w-6 h-6 shrink-0" />
                  </button>
                )}

                <button
                  onClick={handleUninstall}
                  title={t("localization.uninstall")}
                >
                  <X className="w-6 h-6 shrink-0" />
                </button>
              </>
            )}
          </>
        )}

        {!isIdle && (
          <Grid
            color="#cf8d23"
            width={24}
            height={24}
            wrapperClass="shrink-0"
          />
        )}
      </div>

      {isIdle &&
        installedVersion &&
        installedVersion !== localization.version && (
          <div
            className={styles.updates}
            title={`Update available: ${installedVersion} → ${localization.version}`}
          >
            {installedVersion} → {localization.version}
          </div>
        )}
    </div>
  );

  function handleInstall() {
    actions.install(localization);
  }

  function handleUninstall() {
    actions.uninstall(localization);
  }

  function handleRepair() {
    actions.repair(localization);
  }
}

export default observer(Actions);
