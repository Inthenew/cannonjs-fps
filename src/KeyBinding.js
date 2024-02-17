export default class KeyBinding {
    constructor(actions) {
        this.actions = actions;
        for (let key in actions) {
            if (actions.hasOwnProperty(key)) {
                this.actions[key] = false;
            }
        }

        document.addEventListener('keydown', e => {
            this.handleKeyEvent(e, true);
        });

        document.addEventListener('keyup', e => {
            this.handleKeyEvent(e, false);
        });
    }

    handleKeyEvent(event, isKeyDown) {
        for (let key in this.actions) {
            if (this.actions.hasOwnProperty(key) && event.key.toLowerCase() === key.toLowerCase()) {
                this.actions[key] = isKeyDown;
            }
        }
    }
}
