import {Theme} from 'ckn.backend';

class DefaultTheme extends Theme {
    constructor() {
        super();
        this.viewFile = "theme.default.ejs";
        this.addStyle("/themes/default/default.css");
        this.addScript("/themes/default/default.js");
    }
}

export {DefaultTheme}