
/**
 * @name UsernameHistoryTracker
 * @version 1.0.0
 * @description Enregistre les anciens pseudos des utilisateurs visibles et les affiche dans le menu contextuel.
 * @author ChatGPT
 * @source https://github.com/kykydev/UsernameHistoryTracker
 * @updateUrl https://raw.githubusercontent.com/kykydev/UsernameHistoryTracker/main/UsernameHistoryTracker.plugin.js
 */

module.exports = class UsernameHistoryTracker {
    constructor() {
        this.storageKey = "usernameHistory";
        this.usernameData = BdApi.loadData("UsernameHistoryTracker", this.storageKey) || {};
    }

    start() {
        this._patchUserContextMenu();
        this._startUserObserver();
    }

    stop() {
        this._unpatchUserContextMenu();
        this._stopUserObserver();
        BdApi.saveData("UsernameHistoryTracker", this.storageKey, this.usernameData);
    }

    _patchUserContextMenu() {
        BdApi.ContextMenu.patch("user-context", (menu, { user }) => {
            if (!user || !user.id) return;

            const userHistory = this.usernameData[user.id] || [];
            const labelList = userHistory.length
                ? userHistory.join(", ")
                : "Aucun historique";

            const historyItem = BdApi.React.createElement(BdApi.ContextMenu.Item, {
                label: "🕓 Anciens pseudos",
                id: `username-history-${user.id}`,
                action: () => {
                    BdApi.showToast(`Ancien(s) pseudo(s) : ${labelList}`, { type: "info", timeout: 5000 });
                },
            });

            menu.props.children.push(historyItem);
        });
    }

    _unpatchUserContextMenu() {
        BdApi.ContextMenu.unpatch("user-context");
    }

    _startUserObserver() {
        this.interval = setInterval(() => {
            const UserStore = BdApi.findModuleByProps("getUsers", "getUser");
            const users = UserStore.getUsers();

            for (const id in users) {
                const username = users[id].username;
                if (!this.usernameData[id]) {
                    this.usernameData[id] = [username];
                } else if (!this.usernameData[id].includes(username)) {
                    this.usernameData[id].push(username);
                    BdApi.saveData("UsernameHistoryTracker", this.storageKey, this.usernameData);
                }
            }
        }, 6000);
    }

    _stopUserObserver() {
        if (this.interval) clearInterval(this.interval);
    }
};
